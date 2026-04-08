/**
 * Minimal WebDAV client that uses @tauri-apps/plugin-http so requests go
 * through Rust's HTTP stack – bypassing browser CORS restrictions entirely.
 *
 * Supports the subset of WebDAV needed for sync:
 *   GET, PUT, MKCOL, PROPFIND (existence check)
 */

import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

export interface WebDAVOptions {
  serverUrl: string;   // e.g. "https://dav.jianguoyun.com/dav/"
  username: string;
  password: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function basicAuth(username: string, password: string): string {
  // encodeURIComponent → unescape handles non-ASCII usernames/passwords safely
  return 'Basic ' + btoa(unescape(encodeURIComponent(`${username}:${password}`)));
}

function buildUrl(opts: WebDAVOptions, path: string): string {
  const base = opts.serverUrl.replace(/\/+$/, '');
  const rel  = path.replace(/^\/+/, '');
  return `${base}/${rel}`;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Download a file. Returns `{ ok: false }` when status is 404. */
export async function webdavGet(
  opts: WebDAVOptions,
  path: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const resp = await tauriFetch(buildUrl(opts, path), {
    method: 'GET',
    headers: { Authorization: basicAuth(opts.username, opts.password) },
  });
  return {
    ok:     resp.ok,
    status: resp.status,
    body:   resp.ok ? await resp.text() : '',
  };
}

/** Upload (create/replace) a file. */
export async function webdavPut(
  opts: WebDAVOptions,
  path: string,
  body: string,
): Promise<{ ok: boolean; status: number }> {
  const resp = await tauriFetch(buildUrl(opts, path), {
    method:  'PUT',
    headers: {
      Authorization:  basicAuth(opts.username, opts.password),
      'Content-Type': 'application/octet-stream',
    },
    body,
  });
  return { ok: resp.ok, status: resp.status };
}

/**
 * Create a collection (directory).
 * Returns true on success or if the collection already exists (405).
 */
export async function webdavMkcol(opts: WebDAVOptions, path: string): Promise<boolean> {
  try {
    const resp = await tauriFetch(buildUrl(opts, path), {
      method:  'MKCOL',
      headers: { Authorization: basicAuth(opts.username, opts.password) },
    });
    return resp.ok || resp.status === 405; // 405 = Method Not Allowed = already exists
  } catch {
    return false;
  }
}

/**
 * Check whether a resource exists using PROPFIND depth-0.
 * Falls back to HEAD if PROPFIND is rejected.
 */
export async function webdavExists(opts: WebDAVOptions, path: string): Promise<boolean> {
  try {
    const resp = await tauriFetch(buildUrl(opts, path), {
      method:  'PROPFIND',
      headers: {
        Authorization: basicAuth(opts.username, opts.password),
        Depth:         '0',
      },
    });
    return resp.status !== 404;
  } catch {
    return false;
  }
}

/**
 * Quick connectivity + auth check. Sends a PROPFIND on the root path.
 * Returns `{ ok, message }`.
 */
export async function webdavPing(opts: WebDAVOptions): Promise<{ ok: boolean; message: string }> {
  try {
    const resp = await tauriFetch(buildUrl(opts, '/'), {
      method:  'PROPFIND',
      headers: {
        Authorization: basicAuth(opts.username, opts.password),
        Depth:         '0',
      },
    });
    if (resp.status === 207 || resp.ok) return { ok: true,  message: `HTTP ${resp.status}` };
    if (resp.status === 401)            return { ok: false, message: 'Authentication failed (401)' };
    if (resp.status === 403)            return { ok: false, message: 'Access denied (403)' };
    return { ok: false, message: `HTTP ${resp.status}` };
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
