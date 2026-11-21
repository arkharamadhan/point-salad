import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { GameAction, GameState } from '../engine/types';

export interface LobbyPlayer {
  peerId: string;
  name: string;
  isHost: boolean;
  isBot?: boolean;
  botDifficulty?: 'easy' | 'greedy';
}

export type MultiplayerRole = 'none' | 'host' | 'guest';
export type MultiplayerStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface ReactionPayload {
  id: string;
  senderName: string;
  senderIndex: number;
  emoji: string;
  text?: string;
}

export type PeerMessage =
  | { type: 'JOIN_REQUEST'; name: string }
  | { type: 'PLAYER_ACTION'; action: GameAction }
  | { type: 'PLAYER_UNDO' }
  | { type: 'REACTION'; reaction: ReactionPayload }
  | { type: 'LOBBY_UPDATE'; roomCode: string; players: LobbyPlayer[] }
  | {
      type: 'GAME_START';
      gameState: GameState;
      playerPeerIds: (string | null)[];
      seriesWins?: Record<string, number>;
      hasTurnSnapshot?: boolean;
      isRejoin?: boolean;
    }
  | { type: 'STATE_SYNC'; gameState: GameState; hasTurnSnapshot: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'HOST_CLOSED' };

interface BroadcastEnvelope {
  from: string;
  to?: string;
  msg: PeerMessage;
}

const ROOM_PREFIX = 'sayur-heryana-room-';
const CLIENT_ID_STORAGE_KEY = 'sayur-heryana-client-id';
const HOST_RECONNECT_GRACE_MS = 15000;

function getOrCreateClientId(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (existing && existing.trim().length > 0) {
        return existing;
      }
    }
  } catch {
    // ignore storage errors
  }

  const newId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, newId);
    }
  } catch {
    // ignore storage errors
  }

  return newId;
}

function getSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  });
}

interface HostCallbacks {
  onReady: (hostPeerId: string) => void;
  onGuestJoin: (peerId: string, name: string) => void;
  onGuestLeave: (peerId: string) => void;
  onGuestAction: (peerId: string, action: GameAction) => void;
  onGuestUndo: (peerId: string) => void;
  onReaction?: (reaction: ReactionPayload) => void;
  onError: (message: string) => void;
}

interface GuestCallbacks {
  onConnected: (myPeerId: string) => void;
  onLobbyUpdate: (roomCode: string, players: LobbyPlayer[]) => void;
  onGameStart: (
    gameState: GameState,
    playerPeerIds: (string | null)[],
    seriesWins?: Record<string, number>,
    hasTurnSnapshot?: boolean,
    isRejoin?: boolean
  ) => void;
  onStateSync: (gameState: GameState, hasTurnSnapshot: boolean) => void;
  onReaction?: (reaction: ReactionPayload) => void;
  onHostTemporarilyLost?: () => void;
  onHostRestored?: () => void;
  onHostClosed: () => void;
  onError: (message: string) => void;
}

class SupabaseRealtimeManager {
  private supabase: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private myClientId: string | null = null;
  private isHostMode: boolean = false;
  private activeRoomCode: string | null = null;
  private joinTimeoutId: number | null = null;
  private hostDisconnectTimeoutId: number | null = null;

  private ensureClient(): SupabaseClient | null {
    if (!this.supabase) {
      this.supabase = getSupabaseClient();
    }
    return this.supabase;
  }

  getMyPeerId(): string {
    if (!this.myClientId) {
      this.myClientId = getOrCreateClientId();
    }
    return this.myClientId;
  }

  isActiveFor(roomCode: string, role: MultiplayerRole): boolean {
    if (!this.channel || !this.activeRoomCode) return false;
    const normalized = roomCode.trim().toUpperCase();
    const expectedHost = role === 'host';
    return this.activeRoomCode === normalized && this.isHostMode === expectedHost;
  }

  private clearTimers(): void {
    if (this.joinTimeoutId !== null) {
      window.clearTimeout(this.joinTimeoutId);
      this.joinTimeoutId = null;
    }
    if (this.hostDisconnectTimeoutId !== null) {
      window.clearTimeout(this.hostDisconnectTimeoutId);
      this.hostDisconnectTimeoutId = null;
    }
  }

  disconnect(notifyHostClosed: boolean = true): void {
    this.clearTimers();

    if (this.channel) {
      const ch = this.channel;
      if (notifyHostClosed && this.isHostMode && this.myClientId) {
        try {
          ch.send({
            type: 'broadcast',
            event: 'msg',
            payload: {
              from: this.myClientId,
              msg: { type: 'HOST_CLOSED' },
            } satisfies BroadcastEnvelope,
          });
        } catch {
          // ignore
        }
      }

      try {
        if (this.supabase) {
          this.supabase.removeChannel(ch);
        } else {
          ch.unsubscribe();
        }
      } catch {
        // ignore
      }
      this.channel = null;
    }

    this.activeRoomCode = null;
    this.isHostMode = false;
  }

  hostRoom(roomCode: string, callbacks: HostCallbacks): void {
    this.disconnect(false);
    const client = this.ensureClient();
    if (!client) {
      callbacks.onError(
        'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env / Vercel.'
      );
      return;
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    const clientId = getOrCreateClientId();
    this.myClientId = clientId;
    this.isHostMode = true;
    this.activeRoomCode = normalizedCode;

    const channelName = `${ROOM_PREFIX}${normalizedCode}`;
    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: clientId },
      },
    });
    this.channel = channel;

    channel
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        const envelope = payload as BroadcastEnvelope | undefined;
        if (!envelope || !envelope.msg) return;
        if (envelope.to && envelope.to !== clientId) return;

        const { from, msg } = envelope;
        if (msg.type === 'JOIN_REQUEST') {
          callbacks.onGuestJoin(from, msg.name);
        } else if (msg.type === 'PLAYER_ACTION') {
          callbacks.onGuestAction(from, msg.action);
        } else if (msg.type === 'PLAYER_UNDO') {
          callbacks.onGuestUndo(from);
        } else if (msg.type === 'REACTION') {
          callbacks.onReaction?.(msg.reaction);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key && key !== clientId) {
          callbacks.onGuestLeave(key);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'host', clientId });
          callbacks.onReady(clientId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          callbacks.onError('Gagal terhubung ke server Supabase Realtime. Cek koneksi internet.');
        }
      });
  }

  joinRoom(roomCode: string, guestName: string, callbacks: GuestCallbacks): void {
    this.disconnect(false);
    const client = this.ensureClient();
    if (!client) {
      callbacks.onError(
        'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env / Vercel.'
      );
      return;
    }

    const normalizedCode = roomCode.trim().toUpperCase();
    const clientId = getOrCreateClientId();
    this.myClientId = clientId;
    this.isHostMode = false;
    this.activeRoomCode = normalizedCode;

    const channelName = `${ROOM_PREFIX}${normalizedCode}`;
    const channel = client.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: clientId },
      },
    });
    this.channel = channel;

    let confirmedByHost = false;

    const clearHostGraceTimer = () => {
      if (this.hostDisconnectTimeoutId !== null) {
        window.clearTimeout(this.hostDisconnectTimeoutId);
        this.hostDisconnectTimeoutId = null;
        callbacks.onHostRestored?.();
      }
    };

    const sendJoinRequest = () => {
      channel.send({
        type: 'broadcast',
        event: 'msg',
        payload: {
          from: clientId,
          msg: { type: 'JOIN_REQUEST', name: guestName },
        } satisfies BroadcastEnvelope,
      });
    };

    this.joinTimeoutId = window.setTimeout(() => {
      if (!confirmedByHost) {
        callbacks.onError(
          'Room tidak ditemukan atau Host belum membuka room. Cek kembali kode room.'
        );
        this.disconnect(false);
      }
    }, 7000);

    channel
      .on('broadcast', { event: 'msg' }, ({ payload }) => {
        const envelope = payload as BroadcastEnvelope | undefined;
        if (!envelope || !envelope.msg) return;
        if (envelope.to && envelope.to !== clientId) return;

        const { msg } = envelope;
        if (msg.type === 'LOBBY_UPDATE') {
          clearHostGraceTimer();
          if (!confirmedByHost) {
            confirmedByHost = true;
            if (this.joinTimeoutId !== null) {
              window.clearTimeout(this.joinTimeoutId);
              this.joinTimeoutId = null;
            }
            callbacks.onConnected(clientId);
          }
          callbacks.onLobbyUpdate(msg.roomCode, msg.players);
        } else if (msg.type === 'GAME_START') {
          clearHostGraceTimer();
          if (!confirmedByHost) {
            confirmedByHost = true;
            if (this.joinTimeoutId !== null) {
              window.clearTimeout(this.joinTimeoutId);
              this.joinTimeoutId = null;
            }
            callbacks.onConnected(clientId);
          }
          callbacks.onGameStart(
            msg.gameState,
            msg.playerPeerIds,
            msg.seriesWins,
            msg.hasTurnSnapshot,
            msg.isRejoin
          );
        } else if (msg.type === 'STATE_SYNC') {
          clearHostGraceTimer();
          if (!confirmedByHost) {
            confirmedByHost = true;
            if (this.joinTimeoutId !== null) {
              window.clearTimeout(this.joinTimeoutId);
              this.joinTimeoutId = null;
            }
            callbacks.onConnected(clientId);
          }
          callbacks.onStateSync(msg.gameState, msg.hasTurnSnapshot);
        } else if (msg.type === 'REACTION') {
          clearHostGraceTimer();
          callbacks.onReaction?.(msg.reaction);
        } else if (msg.type === 'ERROR') {
          if (this.joinTimeoutId !== null) {
            window.clearTimeout(this.joinTimeoutId);
            this.joinTimeoutId = null;
          }
          callbacks.onError(msg.message);
        } else if (msg.type === 'HOST_CLOSED') {
          this.clearTimers();
          callbacks.onHostClosed();
        }
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const hostJoined = Array.isArray(newPresences)
          ? newPresences.some((p: any) => p?.role === 'host')
          : false;
        if (hostJoined) {
          clearHostGraceTimer();
          if (confirmedByHost) {
            // Host just returned (e.g. after refresh) — re-announce ourselves so host syncs us
            sendJoinRequest();
          }
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const hostLeft = Array.isArray(leftPresences)
          ? leftPresences.some((p: any) => p?.role === 'host')
          : false;
        if (confirmedByHost && hostLeft && this.hostDisconnectTimeoutId === null) {
          callbacks.onHostTemporarilyLost?.();
          this.hostDisconnectTimeoutId = window.setTimeout(() => {
            this.hostDisconnectTimeoutId = null;
            callbacks.onHostClosed();
          }, HOST_RECONNECT_GRACE_MS);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ role: 'guest', clientId });
          sendJoinRequest();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (this.joinTimeoutId !== null) {
            window.clearTimeout(this.joinTimeoutId);
            this.joinTimeoutId = null;
          }
          callbacks.onError('Gagal terhubung ke server Supabase Realtime. Cek koneksi internet.');
        }
      });
  }

  sendToPeer(peerId: string, msg: PeerMessage): void {
    if (!this.channel || !this.myClientId) return;
    this.channel.send({
      type: 'broadcast',
      event: 'msg',
      payload: {
        from: this.myClientId,
        to: peerId,
        msg,
      } satisfies BroadcastEnvelope,
    });
  }

  broadcast(msg: PeerMessage): void {
    if (!this.channel || !this.myClientId) return;
    this.channel.send({
      type: 'broadcast',
      event: 'msg',
      payload: {
        from: this.myClientId,
        msg,
      } satisfies BroadcastEnvelope,
    });
  }

  sendToHost(msg: PeerMessage): void {
    if (!this.channel || !this.myClientId) return;
    this.channel.send({
      type: 'broadcast',
      event: 'msg',
      payload: {
        from: this.myClientId,
        msg,
      } satisfies BroadcastEnvelope,
    });
  }
}

export const peerManager = new SupabaseRealtimeManager();
