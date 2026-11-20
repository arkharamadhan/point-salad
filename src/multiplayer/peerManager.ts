import Peer, { DataConnection } from 'peerjs';
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

export type PeerMessage =
  | { type: 'JOIN_REQUEST'; name: string }
  | { type: 'PLAYER_ACTION'; action: GameAction }
  | { type: 'PLAYER_UNDO' }
  | { type: 'LOBBY_UPDATE'; roomCode: string; players: LobbyPlayer[] }
  | { type: 'GAME_START'; gameState: GameState; playerPeerIds: (string | null)[] }
  | { type: 'STATE_SYNC'; gameState: GameState; hasTurnSnapshot: boolean }
  | { type: 'ERROR'; message: string }
  | { type: 'HOST_CLOSED' };

const ROOM_PREFIX = 'sayur-heryana-room-';

export function roomCodeToPeerId(roomCode: string): string {
  return `${ROOM_PREFIX}${roomCode.trim().toUpperCase()}`;
}

interface HostCallbacks {
  onReady: (hostPeerId: string) => void;
  onGuestJoin: (peerId: string, name: string) => void;
  onGuestLeave: (peerId: string) => void;
  onGuestAction: (peerId: string, action: GameAction) => void;
  onGuestUndo: (peerId: string) => void;
  onError: (message: string) => void;
}

interface GuestCallbacks {
  onConnected: (myPeerId: string) => void;
  onLobbyUpdate: (roomCode: string, players: LobbyPlayer[]) => void;
  onGameStart: (gameState: GameState, playerPeerIds: (string | null)[]) => void;
  onStateSync: (gameState: GameState, hasTurnSnapshot: boolean) => void;
  onHostClosed: () => void;
  onError: (message: string) => void;
}

class PeerManager {
  private peer: Peer | null = null;
  private guestConnections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private myPeerId: string | null = null;

  getMyPeerId(): string | null {
    return this.myPeerId;
  }

  disconnect(): void {
    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch {
        // ignore
      }
      this.hostConnection = null;
    }

    for (const conn of this.guestConnections.values()) {
      try {
        conn.send({ type: 'HOST_CLOSED' } satisfies PeerMessage);
        conn.close();
      } catch {
        // ignore
      }
    }
    this.guestConnections.clear();

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }
    this.myPeerId = null;
  }

  hostRoom(roomCode: string, callbacks: HostCallbacks): void {
    this.disconnect();
    const peerId = roomCodeToPeerId(roomCode);

    const peer = new Peer(peerId, {
      debug: 1,
    });
    this.peer = peer;

    peer.on('open', (id) => {
      this.myPeerId = id;
      callbacks.onReady(id);
    });

    peer.on('connection', (conn) => {
      conn.on('data', (raw) => {
        const msg = raw as PeerMessage;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'JOIN_REQUEST') {
          this.guestConnections.set(conn.peer, conn);
          callbacks.onGuestJoin(conn.peer, msg.name);
        } else if (msg.type === 'PLAYER_ACTION') {
          callbacks.onGuestAction(conn.peer, msg.action);
        } else if (msg.type === 'PLAYER_UNDO') {
          callbacks.onGuestUndo(conn.peer);
        }
      });

      conn.on('close', () => {
        if (this.guestConnections.has(conn.peer)) {
          this.guestConnections.delete(conn.peer);
          callbacks.onGuestLeave(conn.peer);
        }
      });

      conn.on('error', () => {
        if (this.guestConnections.has(conn.peer)) {
          this.guestConnections.delete(conn.peer);
          callbacks.onGuestLeave(conn.peer);
        }
      });
    });

    peer.on('error', (err: any) => {
      if (err?.type === 'unavailable-id') {
        callbacks.onError('Kode room sedang dipakai. Coba buat kode baru.');
      } else {
        callbacks.onError(err?.message || 'Gagal membuka room online.');
      }
    });
  }

  joinRoom(roomCode: string, guestName: string, callbacks: GuestCallbacks): void {
    this.disconnect();
    const hostPeerId = roomCodeToPeerId(roomCode);

    const peer = new Peer({
      debug: 1,
    });
    this.peer = peer;

    let connectedToHost = false;
    const timeoutId = window.setTimeout(() => {
      if (!connectedToHost) {
        callbacks.onError('Room tidak ditemukan atau waktu koneksi habis. Pastikan kode benar.');
        this.disconnect();
      }
    }, 10000);

    peer.on('open', (id) => {
      this.myPeerId = id;
      const conn = peer.connect(hostPeerId, { reliable: true });
      this.hostConnection = conn;

      conn.on('open', () => {
        connectedToHost = true;
        window.clearTimeout(timeoutId);
        callbacks.onConnected(id);
        conn.send({ type: 'JOIN_REQUEST', name: guestName } satisfies PeerMessage);
      });

      conn.on('data', (raw) => {
        const msg = raw as PeerMessage;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'LOBBY_UPDATE') {
          callbacks.onLobbyUpdate(msg.roomCode, msg.players);
        } else if (msg.type === 'GAME_START') {
          callbacks.onGameStart(msg.gameState, msg.playerPeerIds);
        } else if (msg.type === 'STATE_SYNC') {
          callbacks.onStateSync(msg.gameState, msg.hasTurnSnapshot);
        } else if (msg.type === 'ERROR') {
          callbacks.onError(msg.message);
        } else if (msg.type === 'HOST_CLOSED') {
          callbacks.onHostClosed();
        }
      });

      conn.on('close', () => {
        window.clearTimeout(timeoutId);
        if (connectedToHost) {
          callbacks.onHostClosed();
        }
      });

      conn.on('error', () => {
        window.clearTimeout(timeoutId);
        callbacks.onError('Koneksi ke Host terputus.');
      });
    });

    peer.on('error', (err: any) => {
      window.clearTimeout(timeoutId);
      if (err?.type === 'peer-unavailable') {
        callbacks.onError('Room tidak ditemukan. Cek kembali kode room dari Host.');
      } else {
        callbacks.onError(err?.message || 'Gagal terhubung ke server multiplayer.');
      }
    });
  }

  sendToPeer(peerId: string, msg: PeerMessage): void {
    const conn = this.guestConnections.get(peerId);
    if (conn && conn.open) {
      conn.send(msg);
    }
  }

  broadcast(msg: PeerMessage): void {
    for (const conn of this.guestConnections.values()) {
      if (conn.open) {
        conn.send(msg);
      }
    }
  }

  sendToHost(msg: PeerMessage): void {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    }
  }
}

export const peerManager = new PeerManager();
