/**
 * AES-256-GCM encryption/decryption using the Web Crypto API.
 *
 * Wire format (base64-encoded):
 *   [16 bytes salt][12 bytes IV][ciphertext + 16-byte GCM auth tag]
 *
 * Key derivation: PBKDF2-SHA256, 100 000 iterations.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypt a UTF-8 string and return a base64-encoded ciphertext blob. */
export async function encryptData(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv   = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key  = await deriveKey(password, salt);

  const encoded   = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const out = new Uint8Array(SALT_LEN + IV_LEN + cipherBuf.byteLength);
  out.set(salt, 0);
  out.set(iv,   SALT_LEN);
  out.set(new Uint8Array(cipherBuf), SALT_LEN + IV_LEN);

  // Convert to base64 without relying on spread (avoids stack overflow for large buffers)
  let binary = '';
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return btoa(binary);
}

/** Decrypt a base64 blob produced by {@link encryptData} and return the original UTF-8 string. */
export async function decryptData(b64: string, password: string): Promise<string> {
  const binary = atob(b64);
  const raw    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) raw[i] = binary.charCodeAt(i);

  if (raw.length <= SALT_LEN + IV_LEN) throw new Error('Invalid ciphertext: too short');

  const salt       = raw.slice(0, SALT_LEN);
  const iv         = raw.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const ciphertext = raw.slice(SALT_LEN + IV_LEN);

  const key       = await deriveKey(password, salt);
  const plainBuf  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}
