// ============================================================
// DevSpend — Cryptographic Authentication Service
// ============================================================

import {
  User,
  StoredUserRecord,
  AuthSession,
  AuthProvider,
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

const USERS_STORAGE_KEY = 'devspend_auth_users_v1';
const SESSION_STORAGE_KEY = 'devspend_auth_session_v1';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Demo account constant
export const DEMO_USER_ID = 'user_demo';
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  username: 'demo_dev',
  email: 'demo@devspend.io',
  displayName: 'Demo Developer',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  authProvider: 'demo',
  createdAt: '2024-01-01T00:00:00Z',
};

// ============================================================
// User Registry Helpers
// ============================================================
function getStoredUsers(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    const users: StoredUserRecord[] = raw ? JSON.parse(raw) : [];
    // Ensure demo user exists
    if (!users.some((u) => u.id === DEMO_USER_ID)) {
      users.push({
        ...DEMO_USER,
      });
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  } catch {
    return [DEMO_USER];
  }
}

function saveStoredUsers(users: StoredUserRecord[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore quota issues
  }
}

// ============================================================
// Validation Helpers
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

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const sanitized = email.trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(sanitized)) {
    return { valid: false, error: 'Please enter a valid RFC-compliant email address' };
  }
  return { valid: true };
}

// ============================================================
// Auth Actions
// ============================================================

/**
 * Register a new user with PBKDF2 password hashing & 16-byte cryptographic salt
 */
export async function registerWithCredentials(
  rawUsername: string,
  rawEmail: string,
  rawPassword: string
): Promise<{ user: User; session: AuthSession }> {
  const username = sanitizeInput(rawUsername).toLowerCase();
  const email = sanitizeInput(rawEmail).toLowerCase();

  const uVal = validateUsername(username);
  if (!uVal.valid) throw new Error(uVal.error);

  const eVal = validateEmail(email);
  if (!eVal.valid) throw new Error(eVal.error);

  const pStrength = checkPasswordStrength(rawPassword);
  if (!pStrength.isValid) {
    throw new Error(
      'Password must be at least 10 characters long, include uppercase, lowercase, number, and a special character.'
    );
  }

  const users = getStoredUsers();
  if (users.some((u) => u.username === username)) {
    throw new Error('This username is already taken. Please choose another.');
  }
  if (users.some((u) => u.email === email)) {
    throw new Error('An account with this email address already exists.');
  }

  // Derive PBKDF2 hash with 100,000 rounds
  const { hash, salt } = await hashPassword(rawPassword);

  const userId = `user_${generateId()}`;
  const newUserRecord: StoredUserRecord = {
    id: userId,
    username,
    email,
    displayName: username,
    authProvider: 'password',
    passwordHash: hash,
    salt,
    createdAt: isoNow(),
  };

  users.push(newUserRecord);
  saveStoredUsers(users);

  // Generate signed session
  return await issueSession(newUserRecord);
}

/**
 * Sign in using username/email and password with brute-force lockout
 */
export async function loginWithCredentials(
  identifier: string,
  rawPassword: string
): Promise<{ user: User; session: AuthSession }> {
  const normId = sanitizeInput(identifier).toLowerCase();

  // 1. Check brute-force lockout
  const lockout = checkLoginLockout(normId);
  if (lockout.locked) {
    throw new Error(
      `Too many failed attempts. Security cooldown active for ${lockout.remainingSeconds}s.`
    );
  }

  // 2. Lookup user by username or email
  const users = getStoredUsers();
  const userRecord = users.find(
    (u) => u.username === normId || u.email === normId
  );

  if (!userRecord || !userRecord.passwordHash || !userRecord.salt) {
    // Record failed attempt
    const r = recordFailedLogin(normId);
    if (r.locked) {
      throw new Error(`Too many failed attempts. Security cooldown active for 60s.`);
    }
    // Generic error to prevent username enumeration
    throw new Error('Invalid credentials.');
  }

  // 3. Verify cryptographic password hash
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
  return await issueSession(userRecord);
}

/**
 * Sign in as Pre-Populated Demo Account
 */
export async function loginWithDemo(): Promise<{ user: User; session: AuthSession }> {
  const users = getStoredUsers();
  let demoRecord = users.find((u) => u.id === DEMO_USER_ID);
  if (!demoRecord) {
    demoRecord = { ...DEMO_USER };
    users.push(demoRecord);
    saveStoredUsers(users);
  }

  return await issueSession(demoRecord);
}

/**
 * Sign in with Social OAuth (Google or GitHub)
 */
export async function loginWithSocialOAuth(
  provider: 'google' | 'github',
  profile: {
    email: string;
    displayName: string;
    avatarUrl?: string;
    username?: string;
  }
): Promise<{ user: User; session: AuthSession }> {
  const email = sanitizeInput(profile.email).toLowerCase();
  const users = getStoredUsers();

  let userRecord = users.find((u) => u.email === email);

  if (!userRecord) {
    // Create new account linked to social provider
    const baseUsername = (
      profile.username ||
      profile.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_') ||
      email.split('@')[0]
    ).slice(0, 20);

    let username = baseUsername;
    let counter = 1;
    while (users.some((u) => u.username === username)) {
      username = `${baseUsername}_${counter++}`;
    }

    userRecord = {
      id: `user_${provider}_${generateId()}`,
      username,
      email,
      displayName: sanitizeInput(profile.displayName) || username,
      avatarUrl: profile.avatarUrl,
      authProvider: provider,
      createdAt: isoNow(),
    };

    users.push(userRecord);
    saveStoredUsers(users);
  } else {
    // Update avatar if provided
    if (profile.avatarUrl && profile.avatarUrl !== userRecord.avatarUrl) {
      userRecord.avatarUrl = profile.avatarUrl;
      saveStoredUsers(users);
    }
  }

  return await issueSession(userRecord);
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
    email: userRecord.email,
    displayName: userRecord.displayName || userRecord.username,
    avatarUrl: userRecord.avatarUrl,
    authProvider: userRecord.authProvider,
    createdAt: userRecord.createdAt,
  };

  const sessionPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
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
