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
 * Binary assets : upload local files missing from remote; download remote files
 *             missing locally.  Files present on both sides are left as-is
 *             (no overwrite) to minimise bandwidth.
 *
 * ── Bandwidth optimisation ───────────────────────────────────────────────────
 * Auto-sync uses a two-step check before doing a full sync:
 *   1. Local dirty flag  – set whenever settings or any history store changes.
 *   2. Remote manifest   – a tiny encrypted file (manifest.enc) that records
 *      the timestamp of the last successful sync.  Fetching it costs only 1 GET.
 * If neither the local state is dirty nor the remote manifest has changed since
 * the last sync, the auto-sync cycle is skipped entirely.
 *
 * ── Adding a new module ───────────────────────────────────────────────────────
 * 1. Create your history store under store/history/ following the same pattern.
 * 2. Add one entry to HISTORY_MODULES below (import the ref, load fn, etc.).
 *    For modules with binary assets (images, etc.) also supply assetDir +
 *    getAssets.  No other changes to this file are needed.
 */

import { reactive, watch } from 'vue';
import { appLocalDataDir } from '@tauri-apps/api/path';
import { writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { settings }                    from './settings';
import { encryptData, decryptData }    from '../utils/crypto';
import { webdavGet, webdavPut, webdavMkcol, webdavExists, webdavPing } from '../utils/webdav';

// History reactive refs + loaders
import { historyRecords as bibtexRecords,    loadHistory as loadBibtex }    from './history/bibtexConverter';
import { historyRecords as diffRecords,      loadHistory as loadDiff }       from './history/diffViewer';
import { historyRecords as latex2pngRecords, loadHistory as loadLatex2png }  from './history/latex2png';
import { historyRecords as tableGenRecords,  loadHistory as loadTableGen }   from './history/tableGenerator';
import { historyRecords as textConvRecords,  loadHistory as loadTextConv }   from './history/textConverter';
import { historyRecords as textStatsRecords,  loadHistory as loadTextStats }  from './history/textStats';
import { historyRecords as latexConvRecords,  loadHistory as loadLatexConv }  from './history/latexConverter';
import {
  historyRecords as removeBgRecords,
  loadHistory    as loadRemoveBg,
  readImageBytes,
  writeImageBytes,
  persistHistoryToDisk as persistRemoveBgToDisk,
  type RemoveBgRecord,
} from './history/removeBg';

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
 * from falsely marking the local state as dirty again after a successful sync.
 */
let _syncInProgress = false;

/**
 * Epoch-ms timestamp of the most recent local change, or 0 if clean.
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

// ─── Remote manifest (lightweight change detection) ───────────────────────────

interface SyncManifest { syncedAt: string }

const MANIFEST_LS_KEY = 'webdav-manifest-synced-at';

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

/** Ensure the top-level remote directory exists. */
async function ensureRemoteDir(): Promise<void> {
  const base = syncConfig.remotePath.replace(/^\/+|\/+$/g, '');
  await webdavMkcol(dav(), `/${base}/`);
}

// ─── Binary helpers ───────────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── Module registry types ────────────────────────────────────────────────────

interface BaseRecord {
  id:        string;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * A binary asset that lives alongside a history record (e.g. an image file).
 */
interface BinaryAsset {
  /** Path relative to the remote asset directory, e.g. "originals/abc123.jpg" */
  path: string;
  /** Read the local bytes.  Returns null when the file is missing locally. */
  readLocal:  () => Promise<Uint8Array | null>;
  /** Write received bytes to the local path (creates dirs as needed). */
  writeLocal: (data: Uint8Array) => Promise<void>;
}

/**
 * Descriptor for a single history module.  Add one entry to HISTORY_MODULES
 * to register a new module — no other sync code changes required.
 */
interface HistoryModuleDescriptor {
  /** Remote filename for the encrypted JSON metadata, e.g. "h_bibtex.enc" */
  remoteFile: string;
  /** Human-readable label for progress messages */
  label: string;
  /** Reactive ref pointing to the module's record array */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: { value: any[] };
  /** Load records from disk (idempotent – safe to call multiple times) */
  load: () => Promise<void>;
  /**
   * Persist a set of records to disk.
   * Called after a union merge when the local set was updated from remote.
   */
  persist: (records: BaseRecord[]) => Promise<void>;
  /**
   * Remote subdirectory under which binary assets are stored, e.g. "removebg".
   * Omit for JSON-only modules.
   */
  assetDir?: string;
  /**
   * Return the list of binary assets associated with the given records.
   * Only required when assetDir is set.
   */
  getAssets?: (records: BaseRecord[]) => BinaryAsset[];
}

// ─── Disk persistence helper (for local refresh after merge) ─────────────────

let _dataDir: string | null = null;

async function getDataDir(): Promise<string> {
  if (!_dataDir) _dataDir = (await appLocalDataDir()).replace(/[/\\]+$/, '');
  return _dataDir;
}

async function persistToDisk(filename: string, records: BaseRecord[]): Promise<void> {
  try {
    const dir  = await getDataDir();
    const path = `${dir}/${filename}`;
    if (!(await exists(dir))) await mkdir(dir, { recursive: true });
    await writeTextFile(path, JSON.stringify({ version: 1, records }, null, 2));
  } catch (e) {
    console.warn('[sync] failed to write to disk:', filename, e);
  }
}

// ─── Module registry ──────────────────────────────────────────────────────────
//
// To add a new module:
//   1. Import its historyRecords ref and loadHistory function above.
//   2. Push a descriptor object here.  That's it.

const HISTORY_MODULES: HistoryModuleDescriptor[] = [
  {
    remoteFile: 'h_bibtex.enc',
    label:      'BibTeX Converter',
    ref:        bibtexRecords,
    load:       loadBibtex,
    persist:    records => persistToDisk('bibtex_converter_history.json', records),
  },
  {
    remoteFile: 'h_diff.enc',
    label:      'Diff Viewer',
    ref:        diffRecords,
    load:       loadDiff,
    persist:    records => persistToDisk('diff_viewer_history.json', records),
  },
  {
    remoteFile: 'h_latex2png.enc',
    label:      'LaTeX → PNG',
    ref:        latex2pngRecords,
    load:       loadLatex2png,
    persist:    records => persistToDisk('latex2png_history.json', records),
  },
  {
    remoteFile: 'h_tablegen.enc',
    label:      'Table Generator',
    ref:        tableGenRecords,
    load:       loadTableGen,
    persist:    records => persistToDisk('table_generator_history.json', records),
  },
  {
    remoteFile: 'h_textconv.enc',
    label:      'Text Converter',
    ref:        textConvRecords,
    load:       loadTextConv,
    persist:    records => persistToDisk('text_converter_history.json', records),
  },
  {
    remoteFile: 'h_textstats.enc',
    label:      'Text Statistics',
    ref:        textStatsRecords,
    load:       loadTextStats,
    persist:    records => persistToDisk('text_stats_history.json', records),
  },
  {
    remoteFile: 'h_latexconv.enc',
    label:      'Format Converter',
    ref:        latexConvRecords,
    load:       loadLatexConv,
    persist:    records => persistToDisk('latex_converter_history.json', records),
  },
  {
    remoteFile: 'h_removebg.enc',
    label:      'Remove Background',
    ref:        removeBgRecords,
    load:       loadRemoveBg,
    persist:    records => persistRemoveBgToDisk(records as unknown as RemoveBgRecord[]),
    assetDir:   'removebg',
    getAssets:  (records) => (records as unknown as RemoveBgRecord[]).flatMap(r => [
      {
        path:       r.originalPath,
        readLocal:  () => readImageBytes(r.originalPath),
        writeLocal: (data) => writeImageBytes(r.originalPath, data),
      },
      {
        path:       r.processedPath,
        readLocal:  () => readImageBytes(r.processedPath),
        writeLocal: (data) => writeImageBytes(r.processedPath, data),
      },
    ]),
  },
];

// Dirty tracking — watch every module's ref automatically
for (const mod of HISTORY_MODULES) {
  watch(mod.ref, markDirty, { deep: true });
}

// ─── Binary asset sync ────────────────────────────────────────────────────────

/**
 * Sync binary assets for a module:
 *  - Local-only files  → encrypt and upload to remote.
 *  - Remote-only files → download, decrypt, and save locally.
 *  - Files on both sides are left as-is (no overwrite) to save bandwidth.
 */
async function syncBinaryAssets(assetDir: string, assets: BinaryAsset[]): Promise<void> {
  if (assets.length === 0) return;

  // Ensure remote directory tree exists
  await webdavMkcol(dav(), remotePath(`${assetDir}/`));

  const subdirs = [...new Set(
    assets
      .map(a => a.path.split('/').slice(0, -1).join('/'))
      .filter(Boolean),
  )];
  for (const sub of subdirs) {
    await webdavMkcol(dav(), remotePath(`${assetDir}/${sub}/`));
  }

  for (const asset of assets) {
    const remoteFilePath = remotePath(`${assetDir}/${asset.path}`);
    const localData      = await asset.readLocal();

    if (localData) {
      // Have it locally → upload if remote is missing
      const onRemote = await webdavExists(dav(), remoteFilePath);
      if (!onRemote) {
        try {
          const enc = await encryptData(bytesToBase64(localData), syncConfig.password);
          await webdavPut(dav(), remoteFilePath, enc);
        } catch (e) {
          console.warn('[sync] failed to upload asset:', asset.path, e);
        }
      }
    } else {
      // Missing locally → try to download from remote
      try {
        const resp = await webdavGet(dav(), remoteFilePath);
        if (resp.ok) {
          const plain = await decryptData(resp.body, syncConfig.password);
          await asset.writeLocal(base64ToBytes(plain));
        }
      } catch (e) {
        console.warn('[sync] failed to download asset:', asset.path, e);
      }
    }
  }
}

// ─── Settings sync ────────────────────────────────────────────────────────────

interface SettingsEnvelope {
  timestamp: string;
  data: Record<string, unknown>;
}

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
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  let remoteEnvelope: SettingsEnvelope;
  try {
    const plain   = await decryptData(remote.body, password);
    remoteEnvelope = JSON.parse(plain);
  } catch {
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
    return;
  }

  if (remoteEnvelope.timestamp > localEnvelope.timestamp) {
    const savedModelPath = settings.modelPath;
    Object.assign(settings, remoteEnvelope.data);
    settings.modelPath = savedModelPath;
    syncConfig.settingsLastModified = remoteEnvelope.timestamp;
  } else if (localEnvelope.timestamp > remoteEnvelope.timestamp) {
    const enc = await encryptData(JSON.stringify(localEnvelope), password);
    await webdavPut(dav(), path, enc);
  }
}

// ─── Generic history sync ─────────────────────────────────────────────────────

/**
 * Sync one history module:
 *   1. Download + decrypt remote records.
 *   2. Union-merge with local records by ID, sort by timestamp, trim.
 *   3. Apply merged set locally if remote had new entries.
 *   4. Upload merged set if local had new entries.
 *   5. Sync binary assets (if the module declares any).
 */
async function syncHistoryModule(mod: HistoryModuleDescriptor): Promise<void> {
  syncStatus.progress = `Syncing history: ${mod.label}…`;

  const password   = syncConfig.password;
  const path       = remotePath(mod.remoteFile);
  const maxRecords = settings.historyMaxRecords ?? 100;
  const local      = mod.ref.value as BaseRecord[];

  const remote = await webdavGet(dav(), path);

  if (!remote.ok) {
    if (local.length > 0) {
      const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
      await webdavPut(dav(), path, enc);
    }
    // Still sync binary assets even when no remote JSON exists yet
    if (mod.assetDir && mod.getAssets) {
      await syncBinaryAssets(mod.assetDir, mod.getAssets(local));
    }
    return;
  }

  let remoteRecords: BaseRecord[] = [];
  try {
    const plain   = await decryptData(remote.body, password);
    const payload = JSON.parse(plain);
    remoteRecords = Array.isArray(payload.records) ? payload.records : [];
  } catch {
    const enc = await encryptData(JSON.stringify({ version: 1, records: local }), password);
    await webdavPut(dav(), path, enc);
    if (mod.assetDir && mod.getAssets) {
      await syncBinaryAssets(mod.assetDir, mod.getAssets(local));
    }
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
    mod.ref.value = merged;
    await mod.persist(merged);
  }

  // ── Upload merged records if local had new data ───────────────────────────
  if (newFromLocal.length > 0 || merged.length < remoteRecords.length) {
    const enc = await encryptData(JSON.stringify({ version: 1, records: merged }), password);
    await webdavPut(dav(), path, enc);
  }

  // ── Sync binary assets using the final merged record set ──────────────────
  if (mod.assetDir && mod.getAssets) {
    await syncBinaryAssets(mod.assetDir, mod.getAssets(merged));
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
 * Run a sync cycle.  Checks the remote manifest first (1 GET) to avoid a
 * full sync when nothing has changed on either side.
 *
 * Both the manual "Sync Now" button and the auto-sync timer call this function,
 * so behaviour is always identical and bandwidth-efficient.
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

  // ── Pre-flight: check manifest (1 GET) ────────────────────────────────────
  try {
    syncStatus.progress = 'Checking for changes…';
    const manifest      = await fetchRemoteManifest();

    const remoteChanged = manifest === null || manifest.syncedAt !== _lastKnownRemoteSyncedAt;
    const localDirty    = _localDirtyAt > 0;

    if (!remoteChanged && !localDirty) {
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
    // Manifest fetch failed → fall through to full sync
  }

  try {
    // Load all history from disk before syncing (so data isn't missed if the
    // user hasn't visited those pages in this session yet).
    syncStatus.progress = 'Loading local history…';
    await Promise.all(HISTORY_MODULES.map(m => m.load()));

    syncStatus.progress = 'Preparing remote directory…';
    await ensureRemoteDir();

    await syncSettings();

    for (const mod of HISTORY_MODULES) {
      await syncHistoryModule(mod);
    }

    const syncedAt        = new Date().toISOString();
    syncStatus.state      = 'success';
    syncStatus.lastSyncAt = syncedAt;
    syncStatus.progress   = '';
    localStorage.setItem('webdav-sync-last-at', syncedAt);

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

watch(
  () => ({ enabled: syncConfig.enabled, interval: syncConfig.autoSyncIntervalMinutes }),
  ({ enabled, interval }) => {
    if (enabled && interval > 0) startAutoSync(interval);
    else stopAutoSync();
  },
  { immediate: true },
);
