// ============================================================
// DevSpend — Cryptographic Security & Anti-Bypass Utilities
// ============================================================

import { PasswordStrength } from '../types';

// Convert ArrayBuffer or Uint8Array to Hex String
function buf2hex(buffer: ArrayBuffer | Uint8Array | ArrayBufferLike): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Base64Url Encoding/Decoding
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// ============================================================
// 1. Web Crypto API Password Hashing (PBKDF2 + SHA-256)
// ============================================================
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

export async function hashPassword(
  password: string,
  existingSaltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(password);

  let saltBytes: Uint8Array;
  if (existingSaltHex) {
    saltBytes = hex2buf(existingSaltHex);
  } else {
    const raw = new Uint8Array(16);
    crypto.getRandomValues(raw as unknown as Uint8Array<ArrayBuffer>);
    saltBytes = raw;
  }

  // Import raw password as key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2 with SHA-256 and 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    KEY_LENGTH_BITS
  );

  return {
    hash: buf2hex(derivedBits),
    salt: buf2hex(saltBytes),
  };
}

export async function verifyPassword(
  password: string,
  storedHashHex: string,
  saltHex: string
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, saltHex);
    // Constant-time comparison simulation
    if (hash.length !== storedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) {
      diff |= hash.charCodeAt(i) ^ storedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

// ============================================================
// 2. Interactive Password Strength Analyzer
// ============================================================
export function checkPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const trueCount = Object.values(checks).filter(Boolean).length;
  const isValid = Object.values(checks).every(Boolean);

  let label: PasswordStrength['label'] = 'Very Weak';
  if (trueCount === 2) label = 'Weak';
  else if (trueCount === 3) label = 'Fair';
  else if (trueCount === 4) label = 'Strong';
  else if (trueCount === 5) label = 'Very Strong';

  return {
    isValid,
    score: trueCount,
    label,
    checks,
  };
}

// ============================================================
// 3. HMAC-SHA256 Signed Session Tokens (Anti-Tampering)
// ============================================================
const DEVICE_SECRET_KEY = 'devspend_auth_device_secret_v1';

function getOrGenerateDeviceSecret(): string {
  let secret = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!secret) {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes as unknown as Uint8Array<ArrayBuffer>);
    secret = buf2hex(randomBytes);
    localStorage.setItem(DEVICE_SECRET_KEY, secret);
  }
  return secret;
}

async function getHmacCryptoKey(): Promise<CryptoKey> {
  const secretHex = getOrGenerateDeviceSecret();
  const secretBytes = hex2buf(secretHex);
  return await crypto.subtle.importKey(
    'raw',
    secretBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSignedSessionToken(payload: object): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = base64UrlEncode(payloadJson);
  const key = await getHmacCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadBase64)
  );
  const signatureHex = buf2hex(signatureBuffer);
  return `${payloadBase64}.${signatureHex}`;
}

export async function verifySignedSessionToken<T = any>(token: string): Promise<T | null> {
  if (!token || !token.includes('.')) return null;

  try {
    const [payloadBase64, providedSigHex] = token.split('.');
    if (!payloadBase64 || !providedSigHex) return null;

    const key = await getHmacCryptoKey();
    const expectedSigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payloadBase64)
    );
    const expectedSigHex = buf2hex(expectedSigBuffer);

    // Constant-time check
    if (providedSigHex.length !== expectedSigHex.length) return null;
    let diff = 0;
    for (let i = 0; i < expectedSigHex.length; i++) {
      diff |= providedSigHex.charCodeAt(i) ^ expectedSigHex.charCodeAt(i);
    }
    if (diff !== 0) return null;

    // Decode and verify expiration
    const parsedPayload = JSON.parse(base64UrlDecode(payloadBase64)) as any;
    if (parsedPayload.expiresAt && Date.now() > parsedPayload.expiresAt) {
      return null; // Expired
    }

    return parsedPayload as T;
  } catch {
    return null;
  }
}

// ============================================================
// 4. Brute-Force & Enumeration Protection
// ============================================================
const BRUTE_FORCE_KEY = 'devspend_auth_failed_logins';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 60 seconds

interface FailedAttemptsRecord {
  count: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

function getFailedAttemptsStore(): Record<string, FailedAttemptsRecord> {
  try {
    const raw = localStorage.getItem(BRUTE_FORCE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFailedAttemptsStore(store: Record<string, FailedAttemptsRecord>): void {
  try {
    localStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota errors
  }
}

export function checkLoginLockout(username: string): {
  locked: boolean;
  remainingSeconds: number;
} {
  const normUser = username.trim().toLowerCase();
  const store = getFailedAttemptsStore();
  const record = store[normUser];

  if (!record || !record.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  if (now >= record.lockedUntil) {
    // Cooldown expired
    delete store[normUser];
    saveFailedAttemptsStore(store);
    return { locked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
  return { locked: true, remainingSeconds };
}

export function recordFailedLogin(username: string): {
  locked: boolean;
  remainingSeconds: number;
} {
  const normUser = username.trim().toLowerCase();
  const store = getFailedAttemptsStore();
  const now = Date.now();
  const record = store[normUser] || { count: 0, lastAttemptAt: now };

  record.count += 1;
  record.lastAttemptAt = now;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    store[normUser] = record;
    saveFailedAttemptsStore(store);
    return { locked: true, remainingSeconds: 60 };
  }

  store[normUser] = record;
  saveFailedAttemptsStore(store);
  return { locked: false, remainingSeconds: 0 };
}

export function resetFailedLogins(username: string): void {
  const normUser = username.trim().toLowerCase();
  const store = getFailedAttemptsStore();
  if (store[normUser]) {
    delete store[normUser];
    saveFailedAttemptsStore(store);
  }
}

// ============================================================
// 5. XSS & Prototype Pollution Sanitization
// ============================================================
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Strip script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip inline javascript: URIs
    .replace(/javascript:/gi, '')
    // Strip inline event handlers (onerror=, onload=, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Escape HTML special characters
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return sanitized.trim();
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;

  const clean: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (DANGEROUS_KEYS.includes(key)) {
      continue; // Block prototype pollution
    }

    if (typeof value === 'string') {
      clean[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}
