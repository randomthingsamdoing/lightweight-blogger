const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const ITERATIONS = 100000;

const SHA_ITERATIONS = 100000;

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data, passphrase) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(passphrase, salt);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  
  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  };
}

export async function decrypt(encryptedObj, passphrase) {
  const salt = new Uint8Array(atob(encryptedObj.salt).split('').map(c => c.charCodeAt(0)));
  const iv = new Uint8Array(atob(encryptedObj.iv).split('').map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(encryptedObj.data).split('').map(c => c.charCodeAt(0)));
  
  const key = await deriveKey(passphrase, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}

export function generateSalt() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
}

export function generateIV() {
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
}

export async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: SHA_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return {
    hash: btoa(String.fromCharCode(...new Uint8Array(hash))),
    salt: btoa(String.fromCharCode(...salt))
  };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  if (!storedSalt) {
    return false;
  }
  
  const salt = new Uint8Array(atob(storedSalt).split('').map(c => c.charCodeAt(0)));
  const enc = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: SHA_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  const computedHash = btoa(String.fromCharCode(...new Uint8Array(hash)));
  
  return computedHash === storedHash;
}
