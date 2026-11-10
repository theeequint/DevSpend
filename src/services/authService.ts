// ============================================================
// DevSpend — Cryptographic Authentication Service
// Strict Username + Password ONLY • GitHub-Backed Shards
// ============================================================

import {
  User,
  StoredUserRecord,
  AuthSession,
  UserDataSnapshot,
} from '../types';
import {
  hashPassword,
  verifyPassword,
  checkPasswordStrength,
  createSignedSessionToken,
  verifySignedSessionToken,
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLogins,
  sanitizeInput,
} from '../utils/security';
import { generateId, isoNow } from '../utils/formatters';
import {
  findUserInShards,
  appendUserToShards,
  SEED_DEMO_USER,
} from './userShardService';

const SESSION_STORAGE_KEY = 'devspend_auth_session_v1';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Demo account constant
export const DEMO_USER_ID = 'user_demo';
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  username: 'demo_dev',
  displayName: 'Demo Developer',
  authProvider: 'password',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// ============================================================
// Validation Helpers (Username + Password Only)
// ============================================================
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const sanitized = username.trim().toLowerCase();
  if (sanitized.length < 3 || sanitized.length > 24) {
    return { valid: false, error: 'Username must be between 3 and 24 characters' };
  }
  if (!/^[a-z0-9_]+$/.test(sanitized)) {
    return { valid: false, error: 'Username may only contain letters, numbers, and underscores' };
  }
  return { valid: true };
}

// ============================================================
// Auth Actions
// ============================================================

/**
 * Register a new user with PBKDF2 password hashing & 16-byte cryptographic salt.
 * Directly appends and commits to PublicUsersData/ shards.
 */
export async function registerWithCredentials(
  rawUsername: string,
  rawPassword: string,
  rawConfirmPassword?: string,
  initialSnapshot?: UserDataSnapshot
): Promise<{ user: User; session: AuthSession; userDataSnapshot?: UserDataSnapshot }> {
  const username = sanitizeInput(rawUsername).toLowerCase();

  // 1. Username validation
  const uVal = validateUsername(username);
  if (!uVal.valid) throw new Error(uVal.error);

  // 2. Password strength validation
  const pStrength = checkPasswordStrength(rawPassword);
  if (!pStrength.isValid) {
    throw new Error(
      'Password must be at least 10 characters long, include uppercase, lowercase, number, and a special character.'
    );
  }

  // 3. Confirm password validation
  if (rawConfirmPassword !== undefined && rawPassword !== rawConfirmPassword) {
    throw new Error('Passwords do not match. Please re-enter your password.');
  }

  // 4. Derive PBKDF2 hash with 100,000 rounds and 16-byte salt
  const { hash, salt } = await hashPassword(rawPassword);

  const userId = `user_${generateId()}`;
  const newUserRecord: StoredUserRecord = {
    id: userId,
    username,
    displayName: username,
    authProvider: 'password',
    passwordHash: hash,
    salt,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    userDataSnapshot: initialSnapshot,
  };

  // 5. Append to GitHub-backed PublicUsersData shards (max 200 users per file)
  await appendUserToShards(newUserRecord);

  // 6. Generate cryptographically signed HMAC-SHA256 session
  const sessionRes = await issueSession(newUserRecord);
  return {
    ...sessionRes,
    userDataSnapshot: initialSnapshot,
  };
}

/**
 * Sign in using username and password with brute-force lockout.
 * Verified directly against PublicUsersData/ shard files.
 */
export async function loginWithCredentials(
  identifier: string,
  rawPassword: string
): Promise<{ user: User; session: AuthSession; userDataSnapshot?: UserDataSnapshot }> {
  const normId = sanitizeInput(identifier).toLowerCase();

  // 1. Check brute-force lockout
  const lockout = checkLoginLockout(normId);
  if (lockout.locked) {
    throw new Error(
      `Too many failed attempts. Security cooldown active for ${lockout.remainingSeconds}s.`
    );
  }

  // 2. Lookup user record from PublicUsersData/ shards
  const userRecord = await findUserInShards(normId);

  if (!userRecord || !userRecord.passwordHash || !userRecord.salt) {
    // Record failed attempt
    const r = recordFailedLogin(normId);
    if (r.locked) {
      throw new Error(`Too many failed attempts. Security cooldown active for 60s.`);
    }
    // Generic error to prevent username enumeration
    throw new Error('Invalid credentials.');
  }

  // 3. Verify cryptographic password hash via PBKDF2 Web Crypto API
  const isValid = await verifyPassword(
    rawPassword,
    userRecord.passwordHash,
    userRecord.salt
  );

  if (!isValid) {
    const r = recordFailedLogin(normId);
    if (r.locked) {
      throw new Error(`Too many failed attempts. Security cooldown active for 60s.`);
    }
    throw new Error('Invalid credentials.');
  }

  // 4. Success — reset failed attempts
  resetFailedLogins(normId);

  // 5. Issue HMAC-SHA256 signed session token
  const sessionRes = await issueSession(userRecord);
  return {
    ...sessionRes,
    userDataSnapshot: userRecord.userDataSnapshot,
  };
}

/**
 * Sign in as Pre-Populated Demo Account
 */
export async function loginWithDemo(): Promise<{ user: User; session: AuthSession; userDataSnapshot?: UserDataSnapshot }> {
  const sessionRes = await issueSession(SEED_DEMO_USER);
  return {
    ...sessionRes,
    userDataSnapshot: SEED_DEMO_USER.userDataSnapshot,
  };
}

/**
 * Issue cryptographically signed HMAC-SHA256 session token
 */
async function issueSession(
  userRecord: StoredUserRecord
): Promise<{ user: User; session: AuthSession }> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_DURATION_MS;

  const user: User = {
    id: userRecord.id,
    username: userRecord.username,
    displayName: userRecord.displayName || userRecord.username,
    avatarUrl: userRecord.avatarUrl,
    authProvider: userRecord.authProvider,
    createdAt: userRecord.createdAt,
  };

  const sessionPayload = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    issuedAt,
    expiresAt,
  };

  const token = await createSignedSessionToken(sessionPayload);

  const session: AuthSession = {
    ...sessionPayload,
    token,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage quota
  }

  return { user, session };
}

/**
 * Validate current session from localStorage using HMAC signature check
 */
export async function getVerifiedCurrentSession(): Promise<AuthSession | null> {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const storedSession = JSON.parse(raw) as AuthSession;
    if (!storedSession.token) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Cryptographic anti-tamper check
    const verifiedPayload = await verifySignedSessionToken<AuthSession>(
      storedSession.token
    );

    if (!verifiedPayload) {
      console.warn('Session verification failed: Signature mismatch or expired token.');
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return storedSession;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/**
 * Securely clear user session
 */
export function terminateSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    //
  }
}
