import type { StateStorage } from 'zustand/middleware';

const CLIENT_ID_SESSION_KEY = 'sayur-heryana-client-id';
const MP_BACKUP_STORAGE_KEY = 'sayur-heryana-mp-backup';
const TAB_ALIVE_PREFIX = 'sayur-heryana-tab-alive-';
const MP_BACKUP_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const TAB_ALIVE_STALE_MS = 5000;

interface SessionBackupRecord {
  clientId: string;
  savedAt: number;
  payload: string;
}

let heartbeatTimerId: number | null = null;
let heartbeatClientId: string | null = null;
let unloadListenerBound = false;

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getAliveKey(clientId: string): string {
  return `${TAB_ALIVE_PREFIX}${clientId}`;
}

export function isClientAliveInAnotherTab(clientId: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const raw = window.localStorage.getItem(getAliveKey(clientId));
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < TAB_ALIVE_STALE_MS;
  } catch {
    return false;
  }
}

export function stopClientHeartbeat(): void {
  if (heartbeatTimerId !== null) {
    window.clearInterval(heartbeatTimerId);
    heartbeatTimerId = null;
  }
  if (heartbeatClientId) {
    try {
      window.localStorage?.removeItem(getAliveKey(heartbeatClientId));
    } catch {
      // ignore
    }
    heartbeatClientId = null;
  }
}

export function startClientHeartbeat(clientId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  if (heartbeatClientId === clientId && heartbeatTimerId !== null) {
    return;
  }

  stopClientHeartbeat();
  heartbeatClientId = clientId;

  const beat = () => {
    try {
      window.localStorage.setItem(getAliveKey(clientId), String(Date.now()));
    } catch {
      // ignore
    }
  };

  beat();
  heartbeatTimerId = window.setInterval(beat, 2000);

  if (!unloadListenerBound) {
    unloadListenerBound = true;
    const handleUnload = () => {
      if (heartbeatClientId) {
        try {
          window.localStorage.removeItem(getAliveKey(heartbeatClientId));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
  }
}

export function getOrCreateClientId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existing = window.sessionStorage.getItem(CLIENT_ID_SESSION_KEY);
      if (existing && existing.trim().length > 0) {
        return existing;
      }
    }
  } catch {
    // ignore
  }

  const newId = generateUuid();
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(CLIENT_ID_SESSION_KEY, newId);
    }
  } catch {
    // ignore
  }

  return newId;
}

function setSessionClientId(clientId: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(CLIENT_ID_SESSION_KEY, clientId);
    }
  } catch {
    // ignore
  }
}

function hasActiveMpSession(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    return Boolean(state && state.mpRole && state.mpRole !== 'none' && state.roomCode);
  } catch {
    return false;
  }
}

/**
 * Tab-aware Zustand storage:
 * - Primary: `sessionStorage` (survives page refresh F5, isolated per tab so 2 tabs in the same browser never collide!)
 * - Backup: `localStorage` (survives tab close & reopen, restored only if no other open tab owns that clientId)
 */
export function createTabAwareStorage(): StateStorage {
  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') return null;

      try {
        // 1. Prefer this tab's own sessionStorage (handles refresh cleanly per tab)
        const sessionRaw = window.sessionStorage?.getItem(name) ?? null;
        if (hasActiveMpSession(sessionRaw)) {
          const cid = getOrCreateClientId();
          startClientHeartbeat(cid);
          return sessionRaw;
        }

        // 2. If this is a fresh tab (e.g. user closed tab and reopened URL),
        //    check if there's an unclaimed localStorage backup from a closed tab
        const backupRaw = window.localStorage?.getItem(MP_BACKUP_STORAGE_KEY) ?? null;
        if (backupRaw) {
          const backup = JSON.parse(backupRaw) as SessionBackupRecord;
          const isFresh =
            typeof backup?.savedAt === 'number' &&
            Date.now() - backup.savedAt < MP_BACKUP_TTL_MS;
          if (
            backup?.clientId &&
            backup?.payload &&
            isFresh &&
            hasActiveMpSession(backup.payload) &&
            !isClientAliveInAnotherTab(backup.clientId)
          ) {
            setSessionClientId(backup.clientId);
            startClientHeartbeat(backup.clientId);
            window.sessionStorage?.setItem(name, backup.payload);
            return backup.payload;
          }
        }

        // 3. Otherwise return sessionStorage (if any), or fall back to localStorage ONLY for general prefs
        //    (explicitly stripping any stale multiplayer state from older versions)
        if (sessionRaw) return sessionRaw;
        const localRaw = window.localStorage?.getItem(name) ?? null;
        if (!localRaw) return null;
        if (hasActiveMpSession(localRaw)) {
          try {
            const parsed = JSON.parse(localRaw);
            if (parsed?.state) {
              parsed.state.screen = 'menu';
              parsed.state.roomCode = null;
              parsed.state.mpRole = 'none';
              parsed.state.mpLobbyPlayers = [];
              parsed.state.mpMyPlayerIndex = null;
              parsed.state.mpPlayerPeerIds = [];
              parsed.state.mpSessionUpdatedAt = null;
            }
            return JSON.stringify(parsed);
          } catch {
            return null;
          }
        }
        return localRaw;
      } catch {
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      if (typeof window === 'undefined') return;

      try {
        window.sessionStorage?.setItem(name, value);
      } catch {
        // ignore
      }

      try {
        const myClientId = getOrCreateClientId();
        if (hasActiveMpSession(value)) {
          const backup: SessionBackupRecord = {
            clientId: myClientId,
            savedAt: Date.now(),
            payload: value,
          };
          window.localStorage?.setItem(MP_BACKUP_STORAGE_KEY, JSON.stringify(backup));
          startClientHeartbeat(myClientId);
        } else {
          // Only clear backup if it belonged to THIS tab (never wipe another open tab's backup!)
          const existingRaw = window.localStorage?.getItem(MP_BACKUP_STORAGE_KEY);
          if (existingRaw) {
            try {
              const existing = JSON.parse(existingRaw) as SessionBackupRecord;
              if (existing?.clientId === myClientId) {
                window.localStorage.removeItem(MP_BACKUP_STORAGE_KEY);
              }
            } catch {
              // ignore
            }
          }
          stopClientHeartbeat();
          // Still persist general preferences (lang, sound, etc.) to localStorage
          window.localStorage?.setItem(name, value);
        }
      } catch {
        // ignore
      }
    },

    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      try {
        window.sessionStorage?.removeItem(name);
      } catch {
        // ignore
      }
    },
  };
}
