/**
 * WebDAV Sync Store
 *
 * Syncs app settings and all history modules to a user-configured WebDAV
 * server (default: Jianguoyun / 坚果云).
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 * Every remote file is encrypted with AES-256-GCM before upload.
 * The encryption key is derived from the WebDAV password via PBKDF2-SHA256
 * (100 000 iterations + random salt).  Even if someone gains access to the
 * remote storage they cannot read the content without the password.
 *
 * ── Conflict resolution ──────────────────────────────────────────────────────
 * Settings  : last-write-wins per-sync using an ISO timestamp stored alongside
 *             the payload.  Device-specific fields (modelPath) are never synced.
 * History   : union merge by record ID → sort by timestamp DESC → trim to
 *             historyMaxRecords.  New records on either side are preserved.
 *
 * ── Bandwidth optimisation ───────────────────────────────────────────────────
 * Auto-sync uses a two-step check before doing a full sync:
 *   1. Local dirty flag  – set whenever settings or any history store changes.
 *   2. Remote manifest   – a tiny encrypted file (manifest.enc) that records
 *      the timestamp of the last successful sync.  Fetching it costs only 1 GET.
 * If neither the local state is dirty nor the remote manifest has changed since
 * the last sync, the auto-sync cycle is skipped entirely.  This means a quiet
 * device at the default 15-minute interval only makes 1 GET per cycle instead
 * of 9+ requests, dramatically reducing API call volume.
 */

import { reactive, watch } from 'vue';
import { appLocalDataDir } from '@tauri-apps/api/path';
import { writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { settings }                    from './settings';
import { encryptData, decryptData }    from '../utils/crypto';
import { webdavGet, webdavPut, webdavMkcol, webdavPing } from '../utils/webdav';

// History reactive refs (for reading local state + patching after merge)
import { historyRecords as bibtexRecords,    loadHistory as loadBibtex }    from './history/bibtexConverter';
import { historyRecords as diffRecords,      loadHistory as loadDiff }       from './history/diffViewer';
import { historyRecords as latex2pngRecords, loadHistory as loadLatex2png }  from './history/latex2png';
import { historyRecords as tableGenRecords,  loadHistory as loadTableGen }   from './history/tableGenerator';
import { historyRecords as textConvRecords,  loadHistory as loadTextConv }   from './history/textConverter';
import { historyRecords as textStatsRecords, loadHistory as loadTextStats }  from './history/textStats';
import { historyRecords as removeBgRecords,  loadHistory as loadRemoveBg }   from './history/removeBg';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  username: string;
  password: string;
  /** Remote directory name, relative to WebDAV root.  No leading slash. */
  remotePath: string;
  /** 0 = manual only.  Otherwise sync every N minutes in the background. */
  autoSyncIntervalMinutes: number;
  /** ISO timestamp of the last local settings mutation (for conflict resolution). */
  settingsLastModified: string;
}

export type SyncState = 'idle' | 'syncing' | 'success' | 'error' | 'uptodate';

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: string | null;
  lastError:  string | null;
  /** Short description of the current sync step, empty when idle. */
  progress:   string;
}

// ─── Persistent config (separate localStorage key, never uploaded) ────────────

const SYNC_CONFIG_LS_KEY = 'webdav-sync-config';

const DEFAULT_CONFIG: SyncConfig = {
  enabled:                  false,
  serverUrl:                'https://dav.jianguoyun.com/dav/',
  username:                 '',
  password:                 '',
  remotePath:               'QxploreAssistant',
  autoSyncIntervalMinutes:  0,
  settingsLastModified:     new Date().toISOString(),
};

function loadPersistedConfig(): SyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_LS_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

export const syncConfig = reactive<SyncConfig>(loadPersistedConfig());

// Persist every config change immediately
watch(
  () => ({ ...syncConfig }),
  (v) => localStorage.setItem(SYNC_CONFIG_LS_KEY, JSON.stringify(v)),
);

// ─── Runtime status ───────────────────────────────────────────────────────────

export const syncStatus = reactive<SyncStatus>({
  state:      'idle',
  lastSyncAt: localStorage.getItem('webdav-sync-last-at') ?? null,
  lastError:  null,
  progress:   '',
});

// ─── Local dirty tracking ─────────────────────────────────────────────────────

/**
 * True while a sync cycle is running.  Prevents sync-triggered ref mutations
 * (e.g. writing merged records back to a history store) from falsely marking
 * the local state as dirty again immediately after a successful sync.
 */
let _syncInProgress = false;

/**
 * Epoch-ms timestamp of the most recent local change, or 0 if the local state
 * is clean (unchanged since the last successful sync).
 */
let _localDirtyAt = 0;

function markDirty(): void {
  if (!_syncInProgress) _localDirtyAt = Date.now();
}

// Track settings changes (also updates settingsLastModified for conflict res.)
watch(
  () => JSON.stringify(settings),
  () => {
    syncConfig.settingsLastModified = new Date().toISOString();
    markDirty();
  },
);

// Track history changes across all modules
watch(bibtexRecords,    markDirty, { deep: true });
watch(diffRecords,      markDirty, { deep: true });
watch(latex2pngRecords, markDirty, { deep: true });
watch(tableGenRecords,  markDirty, { deep: true });
watch(textConvRecords,  markDirty, { deep: true });
watch(textStatsRecords, markDirty, { deep: true });
watch(removeBgRecords,  markDirty, { deep: true });

// ─── Remote manifest (lightweight change detection) ───────────────────────────

/**
 * Tiny file uploaded to remote after every successful sync.
 * Reading it (1 GET) lets us detect whether another device has synced more
 * recently than us, without downloading all 8 history/settings files.
 */
interface SyncManifest { syncedAt: string }

const MANIFEST_LS_KEY = 'webdav-manifest-synced-at';

/** Timestamp from the manifest we wrote (or read) on the last successful sync. */
let _lastKnownRemoteSyncedAt: string | null = localStorage.getItem(MANIFEST_LS_KEY);

async function fetchRemoteManifest(): Promise<SyncManifest | null> {
  try {
    const resp = await webdavGet(dav(), remotePath('manifest.enc'));
    if (!resp.ok) return null;
    const plain = await decryptData(resp.body, syncConfig.password);
    return JSON.parse(plain) as SyncManifest;
  } catch {
    return null;
  }
}

async function uploadManifest(syncedAt: string): Promise<void> {
  try {
    const enc = await encryptData(JSON.stringify({ syncedAt }), syncConfig.password);
    await webdavPut(dav(), remotePath('manifest.enc'), enc);
    _lastKnownRemoteSyncedAt = syncedAt;
    localStorage.setItem(MANIFEST_LS_KEY, syncedAt);
  } catch {
    // Non-critical: next sync will still work correctly
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function dav() {
  return {
    serverUrl: syncConfig.serverUrl,
    username:  syncConfig.username,
    password:  syncConfig.password,
  };
}

/** Build a full remote path like "/QxploreAssistant/settings.enc" */
function remotePath(filename: string): string {
  const base = syncConfig.remotePath.replace(/^\/+|\/+$/g, '');
  return `/${base}/${filename}`;
}

/** Ensure the remote directory exists (creates it if missing). */
async function ensureRemoteDir(): Promise<void> {
  const base = syncConfig.remotePath.replace(/^\/+|\/+$/g, '');
  await webdavMkcol(dav(), `/${base}/`);
}

// ─── Settings sync ────────────────────────────────────────────────────────────

interface SettingsEnvelope {
  /** ISO 8601 timestamp of the settings version on this side. */
  timestamp: string;
  /** Sanitised settings (device-specific fields removed). */
  data: Record<string, unknown>;
}

/** Fields that must never be synced (device-specific). */
const SKIP_SETTINGS = new Set(['modelPath']);

function localSettingsSnapshot(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (!SKIP_SETTINGS.has(k)) out[k] = v;
  }
  return out;
}

async function syncSettings(): Promise<void> {
  syncStatus.progress = 'Syncing settings…';

  const password = syncConfig.password;
  const path     = remotePath('settings.enc');

  const localEnvelope: SettingsEnvelope = {
    timestamp: syncConfig.settingsLastModified,
    data:      localSettingsSnapshot(),
  };

  const remote = await webdavGet(dav(), path);

  if (!remote.ok) {
    // File doesn't exist yet → upload local
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  // File exists → compare and merge
  let remoteEnvelope: SettingsEnvelope;
  try {
    const plain   = await decryptData(remote.body, password);
    remoteEnvelope = JSON.parse(plain);
  } catch {
    // Decryption failed (wrong password or corrupted).  Upload local to overwrite.
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  if (remoteEnvelope.timestamp > localEnvelope.timestamp) {
    // Remote is newer → apply it locally, preserve modelPath
    const savedModelPath = settings.modelPath;
    Object.assign(settings, remoteEnvelope.data);
    settings.modelPath = savedModelPath;
    // Update our "last modified" so we don't keep re-uploading
    syncConfig.settingsLastModified = remoteEnvelope.timestamp;
  } else if (localEnvelope.timestamp > remoteEnvelope.timestamp) {
    // Local is newer → upload
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
  }
  // Equal timestamps → no-op
}

// ─── History sync ─────────────────────────────────────────────────────────────

interface BaseRecord {
  id:        string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Generic history sync for any module.
 *
 * @param remoteFile   Remote filename, e.g. "h_bibtex.enc"
 * @param localRef     The module's exported `historyRecords` ref
 * @param diskFile     The module's local JSON filename, e.g. "bibtex_converter_history.json"
 * @param label        Human-readable name for progress reporting
 */
async function syncHistoryModule<T extends BaseRecord>(
  remoteFile: string,
  localRef:   { value: T[] },
  diskFile:   string,
  label:      string,
): Promise<void> {
  syncStatus.progress = `Syncing history: ${label}…`;

  const password   = syncConfig.password;
  const path       = remotePath(remoteFile);
  const maxRecords = settings.historyMaxRecords ?? 100;
  const local      = localRef.value;

  const remote = await webdavGet(dav(), path);

  if (!remote.ok) {
    // No remote copy → upload local if non-empty
    if (local.length > 0) {
      const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
      await webdavPut(dav(), path, enc);
    }
    return;
  }

  // Decrypt remote records
  let remoteRecords: T[] = [];
  try {
    const plain   = await decryptData(remote.body, password);
    const payload = JSON.parse(plain);
    remoteRecords = Array.isArray(payload.records) ? payload.records : [];
  } catch {
    // Decryption failed → upload local to overwrite
    const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  // ── Union merge by ID ──────────────────────────────────────────────────────
  const localIdSet  = new Set(local.map(r => r.id));
  const remoteIdSet = new Set(remoteRecords.map(r => r.id));

  const newFromRemote = remoteRecords.filter(r => !localIdSet.has(r.id));
  const newFromLocal  = local.filter(r => !remoteIdSet.has(r.id));

  const merged = [...local, ...newFromRemote]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxRecords);

  // ── Apply merged records locally if remote had new data ───────────────────
  if (newFromRemote.length > 0 || merged.length < local.length) {
    localRef.value = merged;
    await persistToDisk(diskFile, merged);
  }

  // ── Upload merged records if local had new data or set was trimmed ────────
  if (newFromLocal.length > 0 || merged.length < remoteRecords.length) {
    const enc = await encryptData(JSON.stringify({ version: 1, records: merged }), password);
    await webdavPut(dav(), path, enc);
  }
}

// ─── Disk persistence helper (for local refresh after merge) ─────────────────

let _dataDir: string | null = null;

async function getDataDir(): Promise<string> {
  if (!_dataDir) _dataDir = (await appLocalDataDir()).replace(/[/\\]+$/, '');
  return _dataDir;
}

async function persistToDisk(filename: string, records: unknown[]): Promise<void> {
  try {
    const dir  = await getDataDir();
    const path = `${dir}/${filename}`;
    if (!(await exists(dir))) await mkdir(dir, { recursive: true });
    await writeTextFile(path, JSON.stringify({ version: 1, records }, null, 2));
  } catch (e) {
    console.warn('[sync] failed to write to disk:', filename, e);
  }
}

/** Special case: RemoveBg stores its index at <dataDir>/removebg_history/index.json */
async function persistRemoveBgToDisk(records: unknown[]): Promise<void> {
  try {
    const dir      = await getDataDir();
    const histDir  = `${dir}/removebg_history`;
    const indexPath = `${histDir}/index.json`;
    if (!(await exists(histDir))) await mkdir(histDir, { recursive: true });
    await writeTextFile(indexPath, JSON.stringify({ version: 1, records }, null, 2));
  } catch (e) {
    console.warn('[sync] failed to write removebg index to disk:', e);
  }
}

// ─── RemoveBg special case ────────────────────────────────────────────────────

/** RemoveBg special-cased because it uses a subdirectory for storage. */
async function syncHistoryModuleRemoveBg(): Promise<void> {
  syncStatus.progress = 'Syncing history: Remove Background…';

  const password   = syncConfig.password;
  const path       = remotePath('h_removebg.enc');
  const maxRecords = settings.historyMaxRecords ?? 100;
  const local      = removeBgRecords.value;

  const remote = await webdavGet(dav(), path);

  if (!remote.ok) {
    if (local.length > 0) {
      const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
      await webdavPut(dav(), path, enc);
    }
    return;
  }

  let remoteRecords: typeof local = [];
  try {
    const plain   = await decryptData(remote.body, password);
    const payload = JSON.parse(plain);
    remoteRecords = Array.isArray(payload.records) ? payload.records : [];
  } catch {
    const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  const localIdSet  = new Set(local.map(r => r.id));
  const remoteIdSet = new Set(remoteRecords.map(r => r.id));

  const newFromRemote = remoteRecords.filter(r => !localIdSet.has(r.id));
  const newFromLocal  = local.filter(r => !remoteIdSet.has(r.id));

  const merged = [...local, ...newFromRemote]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, maxRecords);

  if (newFromRemote.length > 0 || merged.length < local.length) {
    removeBgRecords.value = merged;
    await persistRemoveBgToDisk(merged);
  }

  if (newFromLocal.length > 0 || merged.length < remoteRecords.length) {
    const enc = await encryptData(JSON.stringify({ version: 1, records: merged }), password);
    await webdavPut(dav(), path, enc);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Test WebDAV connectivity and credentials.
 * Does NOT require sync to be enabled.
 */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  if (!syncConfig.serverUrl || !syncConfig.username || !syncConfig.password) {
    return { ok: false, message: 'Please fill in server URL, username and password first.' };
  }
  return webdavPing(dav());
}

/**
 * Run a sync cycle: first checks the remote manifest (1 GET) to decide whether
 * a full sync is needed, then syncs settings + all history modules if there are
 * any changes (local or remote).
 *
 * Both the manual "Sync Now" button and the auto-sync timer use this same path,
 * so the behaviour is identical and always bandwidth-efficient.
 */
export async function syncNow(): Promise<void> {
  if (syncStatus.state === 'syncing') return;

  if (!syncConfig.enabled) {
    syncStatus.state     = 'error';
    syncStatus.lastError = 'Sync is disabled.';
    return;
  }
  if (!syncConfig.serverUrl || !syncConfig.username || !syncConfig.password) {
    syncStatus.state     = 'error';
    syncStatus.lastError = 'Sync not fully configured (missing server URL, username or password).';
    return;
  }

  _syncInProgress      = true;
  syncStatus.state     = 'syncing';
  syncStatus.lastError = null;

  // ── Pre-flight check ───────────────────────────────────────────────────────
  // Fetch the tiny manifest file (1 GET) to detect remote changes.
  // If neither local state is dirty nor the remote manifest has advanced, skip.
  try {
    syncStatus.progress = 'Checking for changes…';
    const manifest      = await fetchRemoteManifest();

    // manifest === null → first sync or network error → proceed with full sync
    const remoteChanged = manifest === null || manifest.syncedAt !== _lastKnownRemoteSyncedAt;
    const localDirty    = _localDirtyAt > 0;

    if (!remoteChanged && !localDirty) {
      // Nothing to do — surface the "up to date" state briefly, then revert
      syncStatus.state    = 'uptodate';
      syncStatus.progress = '';
      _syncInProgress     = false;
      setTimeout(() => {
        if (syncStatus.state === 'uptodate')
          syncStatus.state = syncStatus.lastSyncAt ? 'success' : 'idle';
      }, 3000);
      return;
    }
  } catch {
    // Manifest fetch failed → fall through to full sync to be safe
  }

  try {
    // Ensure all history modules are loaded from disk before syncing,
    // so local data isn't missed if the user hasn't visited those pages yet.
    syncStatus.progress = 'Loading local history…';
    await Promise.all([
      loadBibtex(), loadDiff(), loadLatex2png(), loadTableGen(),
      loadTextConv(), loadTextStats(), loadRemoveBg(),
    ]);

    syncStatus.progress = 'Preparing remote directory…';
    await ensureRemoteDir();

    await syncSettings();

    await syncHistoryModule(
      'h_bibtex.enc', bibtexRecords,
      'bibtex_converter_history.json', 'BibTeX Converter',
    );
    await syncHistoryModule(
      'h_diff.enc', diffRecords,
      'diff_viewer_history.json', 'Diff Viewer',
    );
    await syncHistoryModule(
      'h_latex2png.enc', latex2pngRecords,
      'latex2png_history.json', 'LaTeX → PNG',
    );
    await syncHistoryModule(
      'h_tablegen.enc', tableGenRecords,
      'table_generator_history.json', 'Table Generator',
    );
    await syncHistoryModule(
      'h_textconv.enc', textConvRecords,
      'text_converter_history.json', 'Text Converter',
    );
    await syncHistoryModule(
      'h_textstats.enc', textStatsRecords,
      'text_stats_history.json', 'Text Statistics',
    );

    // RemoveBg: sync metadata only (image files are device-local)
    await syncHistoryModuleRemoveBg();

    const syncedAt        = new Date().toISOString();
    syncStatus.state      = 'success';
    syncStatus.lastSyncAt = syncedAt;
    syncStatus.progress   = '';
    localStorage.setItem('webdav-sync-last-at', syncedAt);

    // Upload the manifest and clear the dirty flag
    await uploadManifest(syncedAt);
    _localDirtyAt = 0;
  } catch (e: unknown) {
    syncStatus.state     = 'error';
    syncStatus.lastError = e instanceof Error ? e.message : String(e);
    syncStatus.progress  = '';
  } finally {
    _syncInProgress = false;
  }
}

// ─── Auto-sync ────────────────────────────────────────────────────────────────

let _autoSyncTimer: ReturnType<typeof setInterval> | null = null;

function stopAutoSync(): void {
  if (_autoSyncTimer !== null) {
    clearInterval(_autoSyncTimer);
    _autoSyncTimer = null;
  }
}

function startAutoSync(intervalMinutes: number): void {
  stopAutoSync();
  if (intervalMinutes <= 0) return;
  _autoSyncTimer = setInterval(() => {
    if (syncConfig.enabled) syncNow();
  }, intervalMinutes * 60 * 1000);
}

// React to config changes that affect auto-sync scheduling
watch(
  () => ({ enabled: syncConfig.enabled, interval: syncConfig.autoSyncIntervalMinutes }),
  ({ enabled, interval }) => {
    if (enabled && interval > 0) startAutoSync(interval);
    else stopAutoSync();
  },
  { immediate: true },
);
