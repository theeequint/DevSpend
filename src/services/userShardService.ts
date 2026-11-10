// ============================================================
// DevSpend — GitHub-Backed Sharded User Database Service
// Strictly enforces 200 users max per shard in PublicUsersData/
// ============================================================

import { ShardManifest, UserShardFile, StoredUserRecord, UserDataSnapshot } from '../types';
import { isoNow } from '../utils/formatters';

const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER || '';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || '';
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';
const MANIFEST_PATH = 'PublicUsersData/index_manifest.json';
export const MAX_USERS_PER_SHARD = 200;

const MANIFEST_CACHE_KEY = 'devspend_shard_manifest_v2';
const SHARD_CACHE_PREFIX = 'devspend_user_shard_';
const GITHUB_PAT_KEY = 'devspend_github_pat_v1';

// Seed demo user with pre-hashed PBKDF2 (DemoPassword123!)
export const SEED_DEMO_USER: StoredUserRecord = {
  id: 'user_demo',
  username: 'demo_dev',
  displayName: 'Demo Developer',
  authProvider: 'password',
  passwordHash: '075bb66ef3e81c58ec892ddaeeaaa589422e49323ca234741d6aee3b9b1064be',
  salt: '400ad07ab7b1994fcefd12193791c855',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_MANIFEST: ShardManifest = {
  schemaVersion: '1.0.0',
  maxUsersPerFile: MAX_USERS_PER_SHARD,
  totalRegisteredUsers: 1,
  activeWriteShard: 'users_shard_001.json',
  shards: [
    {
      fileName: 'users_shard_001.json',
      userCount: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

const DEFAULT_SHARD_001: UserShardFile = {
  shardId: 'users_shard_001',
  userCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  users: [SEED_DEMO_USER],
};

/**
 * Retrieve GitHub Personal Access Token (from env or stored settings)
 */
export function getGitHubToken(): string {
  try {
    const envToken = import.meta.env.VITE_GITHUB_TOKEN || '';
    if (envToken) return envToken.trim();
    const stored = localStorage.getItem(GITHUB_PAT_KEY);
    if (stored) return stored.trim();
    return '';
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_PAT_KEY, token.trim());
  } catch {
    //
  }
}

/**
 * Fetch Shard Manifest with fallbacks:
 * 1. Remote GitHub raw / contents
 * 2. Static /PublicUsersData/ relative endpoint
 * 3. LocalStorage cached manifest
 * 4. Default in-memory manifest
 */
export async function getShardManifest(): Promise<ShardManifest> {
  const timestamp = Date.now();

  // Try 1: Remote GitHub Raw (if configured in environment)
  if (GITHUB_OWNER && GITHUB_REPO) try {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${MANIFEST_PATH}?t=${timestamp}`;
    const res = await fetch(rawUrl, { cache: 'no-cache' });
    if (res.ok) {
      const manifest: ShardManifest = await res.json();
      localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(manifest));
      return manifest;
    }
  } catch {
    // Network / offline
  }

  // Try 2: Relative public static asset
  try {
    const localUrl = `/PublicUsersData/index_manifest.json?t=${timestamp}`;
    const res = await fetch(localUrl, { cache: 'no-cache' });
    if (res.ok) {
      const manifest: ShardManifest = await res.json();
      localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(manifest));
      return manifest;
    }
  } catch {
    // Fallback to cache
  }

  // Try 3: Cached in localStorage
  try {
    const cached = localStorage.getItem(MANIFEST_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    //
  }

  // Try 4: In-memory fallback
  return DEFAULT_MANIFEST;
}

/**
 * Fetch an individual User Shard file by filename
 */
export async function getUserShard(fileName: string): Promise<UserShardFile> {
  const timestamp = Date.now();
  const cacheKey = `${SHARD_CACHE_PREFIX}${fileName}`;

  // Try 1: Remote GitHub Raw (if configured in environment)
  if (GITHUB_OWNER && GITHUB_REPO) try {
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/PublicUsersData/${fileName}?t=${timestamp}`;
    const res = await fetch(rawUrl, { cache: 'no-cache' });
    if (res.ok) {
      const shard: UserShardFile = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(shard));
      return shard;
    }
  } catch {
    // Network / offline
  }

  // Try 2: Relative static asset
  try {
    const localUrl = `/PublicUsersData/${fileName}?t=${timestamp}`;
    const res = await fetch(localUrl, { cache: 'no-cache' });
    if (res.ok) {
      const shard: UserShardFile = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(shard));
      return shard;
    }
  } catch {
    // Fallback to cache
  }

  // Try 3: Cached in localStorage
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    //
  }

  // Try 4: Default shard fallback
  if (fileName === 'users_shard_001.json') {
    return DEFAULT_SHARD_001;
  }

  return {
    shardId: fileName.replace('.json', ''),
    userCount: 0,
    createdAt: isoNow(),
    updatedAt: isoNow(),
    users: [],
  };
}

/**
 * Find user across all registered shards
 */
export async function findUserInShards(
  username: string
): Promise<StoredUserRecord | null> {
  const normalized = username.trim().toLowerCase();
  const manifest = await getShardManifest();

  // Always check demo user first for fast fallback
  if (normalized === 'demo_dev') {
    return SEED_DEMO_USER;
  }

  // Start search with active write shard, then inspect others
  const orderedShards = [
    manifest.activeWriteShard,
    ...manifest.shards.map((s) => s.fileName).filter((f) => f !== manifest.activeWriteShard),
  ];

  for (const fileName of orderedShards) {
    try {
      const shard = await getUserShard(fileName);
      const match = shard.users.find(
        (u) => u.username.toLowerCase() === normalized
      );
      if (match) return match;
    } catch {
      // Continue to next shard
    }
  }

  return null;
}

/**
 * Register a new user into the active shard (max 200 users per file).
 * If the active shard has 200 users, automatically rolls over to a new shard file.
 */
export async function appendUserToShards(
  newUser: StoredUserRecord
): Promise<{ manifest: ShardManifest; shard: UserShardFile }> {
  const manifest = await getShardManifest();
  const normalized = newUser.username.toLowerCase();

  // 1. Verify username uniqueness
  const existing = await findUserInShards(normalized);
  if (existing) {
    throw new Error('This username is already taken. Please choose another.');
  }

  let activeFileName = manifest.activeWriteShard || 'users_shard_001.json';
  let activeShard = await getUserShard(activeFileName);

  // 2. Check 200 user maximum limit per shard
  if (activeShard.users.length >= MAX_USERS_PER_SHARD) {
    const nextNumber = manifest.shards.length + 1;
    activeFileName = `users_shard_${String(nextNumber).padStart(3, '0')}.json`;

    activeShard = {
      shardId: activeFileName.replace('.json', ''),
      userCount: 0,
      createdAt: isoNow(),
      updatedAt: isoNow(),
      users: [],
    };

    manifest.activeWriteShard = activeFileName;
    manifest.shards.push({
      fileName: activeFileName,
      userCount: 0,
      updatedAt: isoNow(),
    });
  }

  // 3. Append user to active shard
  activeShard.users.push(newUser);
  activeShard.userCount = activeShard.users.length;
  activeShard.updatedAt = isoNow();

  // 4. Update manifest totals
  manifest.totalRegisteredUsers = (manifest.totalRegisteredUsers || 0) + 1;
  const shardMeta = manifest.shards.find((s) => s.fileName === activeFileName);
  if (shardMeta) {
    shardMeta.userCount = activeShard.userCount;
    shardMeta.updatedAt = activeShard.updatedAt;
  }

  // 5. Persist locally to localStorage
  try {
    localStorage.setItem(MANIFEST_CACHE_KEY, JSON.stringify(manifest));
    localStorage.setItem(
      `${SHARD_CACHE_PREFIX}${activeFileName}`,
      JSON.stringify(activeShard)
    );
  } catch {
    // Quota issues
  }

  // 6. Commit to GitHub Repository via REST API in background
  syncFileToGitHub(
    `PublicUsersData/${activeFileName}`,
    JSON.stringify(activeShard, null, 2),
    `chore(auth): append user @${newUser.username} to ${activeFileName}`
  ).catch((err) => console.warn('GitHub shard sync warning:', err));

  syncFileToGitHub(
    MANIFEST_PATH,
    JSON.stringify(manifest, null, 2),
    `chore(auth): update manifest for @${newUser.username} (${manifest.totalRegisteredUsers} users)`
  ).catch((err) => console.warn('GitHub manifest sync warning:', err));

  return { manifest, shard: activeShard };
}

/**
 * Commit a file to GitHub repository via REST API
 */
export async function syncFileToGitHub(
  filePath: string,
  content: string,
  commitMessage: string
): Promise<boolean> {
  const token = getGitHubToken();
  if (!token || !GITHUB_OWNER || !GITHUB_REPO) return false;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  try {
    // 1. Get current SHA if file exists
    let sha: string | undefined = undefined;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // 2. Base64 encode file content
    const utf8Bytes = new TextEncoder().encode(content);
    let binary = '';
    utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const base64Content = btoa(binary);

    // 3. Put / Update content
    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: GITHUB_BRANCH,
        sha,
      }),
    });

    return putRes.ok;
  } catch (err) {
    console.warn(`Failed to sync ${filePath} to GitHub:`, err);
    return false;
  }
}

/**
 * Update a user's snapshot (projects, expenses, revenues, stakeholders, funding rounds)
 * inside the appropriate shard file in local cache and push to GitHub.
 */
export async function syncUserDataSnapshot(
  userId: string,
  snapshot: UserDataSnapshot
): Promise<boolean> {
  try {
    const manifest = await getShardManifest();
    for (const s of manifest.shards) {
      const shard = await getUserShard(s.fileName);
      const userIndex = shard.users.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        shard.users[userIndex].userDataSnapshot = snapshot;
        shard.users[userIndex].updatedAt = isoNow();
        shard.updatedAt = isoNow();

        // Save to cache
        localStorage.setItem(
          `${SHARD_CACHE_PREFIX}${s.fileName}`,
          JSON.stringify(shard)
        );

        // Commit to GitHub in background
        syncFileToGitHub(
          `PublicUsersData/${s.fileName}`,
          JSON.stringify(shard, null, 2),
          `chore(sync): update user snapshot for ${shard.users[userIndex].username}`
        ).catch(() => {});

        return true;
      }
    }
  } catch {
    // Offline or fallback
  }
  return false;
}
