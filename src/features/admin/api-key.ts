// Simple AES-GCM helpers for storing the Gemini API key in user_settings.
// Encryption uses a key derived from the user's Supabase user-id + a fixed
// app salt. This is obfuscation, not airtight security — the threat model is
// "casual database leak" rather than a determined attacker, since the same
// browser must decrypt for the admin to use it.

const enc = new TextEncoder();
const dec = new TextDecoder();
const APP_SALT = 'map-test-v1';

async function deriveKey(userId: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${userId}:${APP_SALT}`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(APP_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptApiKey(plaintext: string, userId: string): Promise<string> {
  const key = await deriveKey(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv);
  out.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...out));
}

export async function decryptApiKey(b64: string, userId: string): Promise<string> {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const data = buf.slice(12);
  const key = await deriveKey(userId);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(plain);
}
