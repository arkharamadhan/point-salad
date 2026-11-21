import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameAction,
  GameMode,
  GameState,
  initializeGame,
  gameReducer,
  SetupOptions,
  DeckSizeOption,
  createBot,
  ResourceId,
} from '../../engine';
import { SCORING_CONDITIONS_MAP } from '../../engine/scoring';
import {
  LobbyPlayer,
  MultiplayerRole,
  MultiplayerStatus,
  ReactionPayload,
  peerManager,
} from '../../multiplayer/peerManager';
import { createTabAwareStorage } from '../../multiplayer/sessionStorage';
import { Sound } from '../sound/soundEffects';

export interface ActionToastItem {
  id: string;
  text: string;
  actorIndex: number;
}

const VEGGIE_EMOJI: Record<ResourceId, { emoji: string; id: string; en: string }> = {
  tomat: { emoji: '🍅', id: 'Tomat', en: 'Tomato' },
  wortel: { emoji: '🥕', id: 'Wortel', en: 'Carrot' },
  paprika: { emoji: '🫑', id: 'Paprika', en: 'Pepper' },
  selada: { emoji: '🥬', id: 'Selada', en: 'Lettuce' },
  bawang: { emoji: '🧅', id: 'Bawang', en: 'Onion' },
  kubis: { emoji: '🟣', id: 'Kubis', en: 'Cabbage' },
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function buildOpponentActionToast(
  prevState: GameState,
  nextState: GameState,
  lang: 'id' | 'en',
  mpRole: MultiplayerRole,
  mpMyPlayerIndex: number | null
): ActionToastItem | null {
  const actorIdx = prevState.currentTurnPlayerIndex;
  const prevP = prevState.players[actorIdx];
  const nextP = nextState.players[actorIdx];
  if (!prevP || !nextP) return null;

  // Only show toast for opponent (online) or Bot (solo)
  const isOpponentOrBot =
    mpRole !== 'none'
      ? mpMyPlayerIndex !== null && actorIdx !== mpMyPlayerIndex
      : Boolean(prevP.isBot);
  if (!isOpponentOrBot) return null;

  const isId = lang === 'id';
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Drafted veggie resources (including Golden / Rotten notifications)
  if (nextP.draftedResourceCards.length > prevP.draftedResourceCards.length) {
    const added = nextP.draftedResourceCards.slice(prevP.draftedResourceCards.length);
    const names = added
      .map((c) => {
        const info = VEGGIE_EMOJI[c.resource];
        return `${info.emoji} ${isId ? info.id : info.en}`;
      })
      .join(' & ');
    let suffix = '';
    if ((nextP.goldenBonusPoints ?? 0) > (prevP.goldenBonusPoints ?? 0)) {
      suffix = isId ? ' (✨ +3 Emas!)' : ' (✨ +3 Golden!)';
    } else if ((nextP.rottenPenaltyPoints ?? 0) < (prevP.rottenPenaltyPoints ?? 0)) {
      suffix = isId ? ' (🤢 -2 Busuk!)' : ' (🤢 -2 Rotten!)';
    }
    return {
      id,
      actorIndex: actorIdx,
      text: isId
        ? `${prevP.name} ambil ${added.length} Sayur: ${names}${suffix}`
        : `${prevP.name} took ${added.length} Veggie${added.length > 1 ? 's' : ''}: ${names}${suffix}`,
    };
  }

  // 2. Used a Power-Up Skill
  if (!prevP.skillUsed && nextP.skillUsed) {
    const lastLog = nextState.log[nextState.log.length - 1];
    if (lastLog) {
      return { id, actorIndex: actorIdx, text: lastLog };
    }
  }

  // 2. Drafted scoring recipe card
  if (nextP.scoringCards.length > prevP.scoringCards.length) {
    const addedCard = nextP.scoringCards[nextP.scoringCards.length - 1];
    const cond = SCORING_CONDITIONS_MAP.get(addedCard.scoringId);
    const desc = cond ? (cond.text[lang] ?? cond.text.id) : addedCard.scoringId;
    return {
      id,
      actorIndex: actorIdx,
      text: isId
        ? `${prevP.name} ambil Resep: ${desc}`
        : `${prevP.name} took Recipe: ${desc}`,
    };
  }

  // 3. Flipped a scoring card into a veggie
  if (nextP.flippedCards.length > prevP.flippedCards.length) {
    const flipped = nextP.flippedCards[nextP.flippedCards.length - 1];
    const info = VEGGIE_EMOJI[flipped.resource];
    return {
      id,
      actorIndex: actorIdx,
      text: isId
        ? `${prevP.name} balik Resep jadi ${info.emoji} ${info.id}`
        : `${prevP.name} flipped a Recipe into ${info.emoji} ${info.en}`,
    };
  }

  return null;
}

function applySeriesWinIfFinished(
  prevState: GameState,
  nextState: GameState,
  currentWins: Record<string, number>
): Record<string, number> {
  if (
    prevState.phase !== 'game_over' &&
    nextState.phase === 'game_over' &&
    nextState.finalScores &&
    nextState.finalScores.length > 0
  ) {
    const updated = { ...currentWins };
    for (const report of nextState.finalScores) {
      if (report.rank === 1) {
        updated[report.playerId] = (updated[report.playerId] ?? 0) + 1;
      }
    }
    return updated;
  }
  return currentWins;
}

interface GameStoreState {
  screen: 'menu' | 'game';
  roomCode: string | null;
  gameState: GameState;
  selectedResourceSlots: number[];
  lang: 'id' | 'en';
  errorMessage: string | null;
  soundEnabled: boolean;
  musicEnabled: boolean;
  isSettingsOpen: boolean;
  isBotThinking: boolean;
  turnSnapshot: GameState | null;
  inspectedPlayerIndex: number | null;
  shelfViewingPlayerIndex: number | null;

  // Multiplayer state
  mpRole: MultiplayerRole;
  mpStatus: MultiplayerStatus;
  mpError: string | null;
  mpLobbyPlayers: LobbyPlayer[];
  mpMyPlayerIndex: number | null;
  mpPlayerPeerIds: (string | null)[];
  mpRemoteHasSnapshot: boolean;
  mpPlayerName: string;
  mpSessionUpdatedAt: number | null;
  mpHostDisconnected: boolean;

  // Social & Session state
  seriesWins: Record<string, number>;
  lastDeckSize: DeckSizeOption | undefined;
  lastGameMode: GameMode;
  showPowerUpRoll: boolean;
  activeReactions: ReactionPayload[];
  actionToast: ActionToastItem | null;

  // Navigation & Setup Actions
  setScreen: (screen: 'menu' | 'game') => void;
  setRoomCode: (code: string | null) => void;
  startNewGame: (options?: Partial<SetupOptions> & { preserveSeries?: boolean }) => void;

  // Multiplayer Actions
  openOnlineRoom: (hostName: string) => void;
  joinOnlineRoom: (roomCode: string, guestName: string) => void;
  reconnectOnlineRoom: () => void;
  addLobbyBot: () => void;
  removeLobbyPlayer: (peerId: string) => void;
  startOnlineGame: (deckSize?: DeckSizeOption, gameMode?: GameMode) => void;
  rematchOnlineGame: (deckSize?: DeckSizeOption) => void;
  leaveOnlineRoom: () => void;
  clearMpError: () => void;

  // Social & Skill Actions
  sendReaction: (emoji: string, text?: string) => void;
  dismissActionToast: () => void;
  dismissPowerUpRoll: () => void;
  useSkillRefreshMarket: () => void;
  useSkillGrabThree: () => void;
  useSkillSwapVeggie: (
    targetPlayerIndex: number,
    myResource: ResourceId,
    targetResource: ResourceId
  ) => void;
  useSkillGoldenTouch: () => void;
  useSkillStealVeggie: (targetPlayerIndex: number, targetResource: ResourceId) => void;
  useSkillCloneVeggie: (myResource: ResourceId) => void;

  // Gameplay Actions
  selectResourceSlot: (slotIndex: number) => void;
  confirmTakeResources: () => void;
  takeScoringMarket: (slotIndex: number) => void;
  takeScoringPile: (pileIndex: number) => void;
  flipCard: (cardId: string) => void;
  undoCurrentTurnAction: () => void;
  endTurn: () => void;
  executeBotTurnIfNeeded: () => void;
  setLang: (lang: 'id' | 'en') => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  setSettingsOpen: (open: boolean) => void;
  setInspectedPlayerIndex: (index: number | null) => void;
  setShelfViewingPlayerIndex: (index: number | null) => void;
  clearError: () => void;
}

const MP_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const defaultSetup: SetupOptions = {
  players: [
    { id: 'p1', name: 'Pemain 1', isBot: false },
    { id: 'p2', name: 'Bot Pintar', isBot: true, botDifficulty: 'greedy' },
  ],
  seed: Math.floor(Math.random() * 1000000),
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => {
      const pushReaction = (reaction: ReactionPayload) => {
        Sound.emotePop(get().soundEnabled);
        set((state) => ({
          activeReactions: [...state.activeReactions.slice(-4), reaction],
        }));
        window.setTimeout(() => {
          set((state) => ({
            activeReactions: state.activeReactions.filter((r) => r.id !== reaction.id),
          }));
        }, 2900);
      };

      const showToast = (toast: ActionToastItem | null) => {
        if (!toast) return;
        set({ actionToast: toast });
      };

      const canLocalUserAct = (): boolean => {
        const { mpRole, mpMyPlayerIndex, gameState, isBotThinking } = get();
        if (gameState.phase === 'game_over' || isBotThinking) return false;
        if (mpRole === 'none') return true;
        return mpMyPlayerIndex !== null && gameState.currentTurnPlayerIndex === mpMyPlayerIndex;
      };

      const applyAuthoritativeAction = (action: GameAction) => {
        const { gameState, lang, turnSnapshot, mpRole, mpMyPlayerIndex, seriesWins, soundEnabled } =
          get();
        const isEndTurn = action.type === 'END_TURN';
        const isSkill =
          action.type === 'USE_SKILL_REFRESH_MARKET' ||
          action.type === 'USE_SKILL_GRAB_THREE' ||
          action.type === 'USE_SKILL_SWAP_VEGGIE' ||
          action.type === 'USE_SKILL_GOLDEN_TOUCH' ||
          action.type === 'USE_SKILL_STEAL_VEGGIE' ||
          action.type === 'USE_SKILL_CLONE_VEGGIE';
        // Skills cannot be undone (prevents peeking/reshuffling), so snapshot resets on skill use
        const snapshot = isEndTurn || isSkill ? null : (turnSnapshot ?? gameState);
        const nextState = gameReducer(gameState, action, lang);

        // Play special sound if active player grabbed Golden or Rotten veggie
        const actorIdx = gameState.currentTurnPlayerIndex;
        const prevP = gameState.players[actorIdx];
        const nextP = nextState.players[actorIdx];
        if (prevP && nextP) {
          if ((nextP.goldenBonusPoints ?? 0) > (prevP.goldenBonusPoints ?? 0)) {
            Sound.skillActivate(soundEnabled);
          } else if ((nextP.rottenPenaltyPoints ?? 0) < (prevP.rottenPenaltyPoints ?? 0)) {
            Sound.rottenBuzz(soundEnabled);
          }
        }

        const nextSeriesWins = applySeriesWinIfFinished(gameState, nextState, seriesWins);
        const toast = buildOpponentActionToast(gameState, nextState, lang, mpRole, mpMyPlayerIndex);

        set({
          gameState: nextState,
          turnSnapshot: snapshot,
          selectedResourceSlots: [],
          shelfViewingPlayerIndex: isEndTurn ? null : get().shelfViewingPlayerIndex,
          seriesWins: nextSeriesWins,
          errorMessage: null,
          ...(mpRole !== 'none' ? { mpSessionUpdatedAt: Date.now() } : {}),
        });

        showToast(toast);

        if (mpRole === 'host') {
          peerManager.broadcast({
            type: 'STATE_SYNC',
            gameState: nextState,
            hasTurnSnapshot: !!snapshot,
          });
        }

        if (isEndTurn && nextState.phase !== 'game_over') {
          const nextPlayer = nextState.players[nextState.currentTurnPlayerIndex];
          if (nextPlayer?.isBot) {
            setTimeout(() => {
              get().executeBotTurnIfNeeded();
            }, 600);
          }
        }
      };

      const applyAuthoritativeUndo = () => {
        const { turnSnapshot, mpRole } = get();
        if (!turnSnapshot) return;

        set({
          gameState: turnSnapshot,
          turnSnapshot: null,
          selectedResourceSlots: [],
          errorMessage: null,
        });

        if (mpRole === 'host') {
          peerManager.broadcast({
            type: 'STATE_SYNC',
            gameState: turnSnapshot,
            hasTurnSnapshot: false,
          });
        }
      };

      const createHostCallbacks = (code: string, cleanName: string, isReconnect: boolean) => ({
        onReady: (hostPeerId: string) => {
          const { mpLobbyPlayers, screen, gameState, turnSnapshot } = get();
          if (isReconnect) {
            const hasHost = mpLobbyPlayers.some((p) => p.isHost);
            const updatedPlayers: LobbyPlayer[] = hasHost
              ? mpLobbyPlayers.map((p) => (p.isHost ? { ...p, peerId: hostPeerId, name: cleanName } : p))
              : [{ peerId: hostPeerId, name: cleanName, isHost: true }, ...mpLobbyPlayers];
            set({
              mpStatus: 'connected',
              mpLobbyPlayers: updatedPlayers,
              mpError: null,
              mpHostDisconnected: false,
              mpSessionUpdatedAt: Date.now(),
            });
            if (screen === 'menu') {
              peerManager.broadcast({
                type: 'LOBBY_UPDATE',
                roomCode: code,
                players: updatedPlayers,
              });
            } else {
              peerManager.broadcast({
                type: 'STATE_SYNC',
                gameState,
                hasTurnSnapshot: !!turnSnapshot,
              });
              const activePlayer = gameState.players[gameState.currentTurnPlayerIndex];
              if (activePlayer?.isBot && gameState.phase !== 'game_over') {
                setTimeout(() => {
                  get().executeBotTurnIfNeeded();
                }, 600);
              }
            }
            return;
          }

          const initialPlayers: LobbyPlayer[] = [
            { peerId: hostPeerId, name: cleanName, isHost: true },
          ];
          set({
            mpStatus: 'connected',
            mpLobbyPlayers: initialPlayers,
            mpError: null,
            mpHostDisconnected: false,
            mpSessionUpdatedAt: Date.now(),
          });
        },
        onGuestJoin: (peerId: string, guestName: string) => {
          const {
            mpLobbyPlayers,
            roomCode: activeCode,
            screen,
            gameState,
            mpPlayerPeerIds,
            seriesWins,
            turnSnapshot,
          } = get();

          if (screen === 'game') {
            const existingIdx = mpPlayerPeerIds.indexOf(peerId);
            if (existingIdx >= 0) {
              peerManager.sendToPeer(peerId, {
                type: 'GAME_START',
                gameState,
                playerPeerIds: mpPlayerPeerIds,
                seriesWins,
                hasTurnSnapshot: !!turnSnapshot,
                isRejoin: true,
              });
              set({ errorMessage: null, mpSessionUpdatedAt: Date.now() });
              return;
            }
            peerManager.sendToPeer(peerId, {
              type: 'ERROR',
              message: 'Permainan di room ini sudah dimulai.',
            });
            return;
          }

          const exists = mpLobbyPlayers.some((p) => p.peerId === peerId);
          if (!exists && mpLobbyPlayers.length >= 4) {
            peerManager.sendToPeer(peerId, {
              type: 'ERROR',
              message: 'Room sudah penuh (maksimal 4 pemain).',
            });
            return;
          }

          const cleanGuestName = guestName.trim() || `Pemain ${mpLobbyPlayers.length + 1}`;
          const updated = exists
            ? mpLobbyPlayers.map((p) => (p.peerId === peerId ? { ...p, name: cleanGuestName } : p))
            : [...mpLobbyPlayers, { peerId, name: cleanGuestName, isHost: false }];
          set({ mpLobbyPlayers: updated, mpSessionUpdatedAt: Date.now() });
          peerManager.broadcast({
            type: 'LOBBY_UPDATE',
            roomCode: activeCode ?? code,
            players: updated,
          });
        },
        onGuestLeave: (peerId: string) => {
          const { mpLobbyPlayers, roomCode: activeCode, screen } = get();
          if (screen === 'menu') {
            const updated = mpLobbyPlayers.filter((p) => p.peerId !== peerId);
            set({ mpLobbyPlayers: updated });
            peerManager.broadcast({
              type: 'LOBBY_UPDATE',
              roomCode: activeCode ?? code,
              players: updated,
            });
          } else {
            set({
              errorMessage: 'Salah satu pemain terputus dari room (menunggu masuk kembali...).',
            });
          }
        },
        onGuestAction: (peerId: string, action: GameAction) => {
          const { gameState, mpPlayerPeerIds } = get();
          const activePeerId = mpPlayerPeerIds[gameState.currentTurnPlayerIndex];
          if (activePeerId !== peerId) return;
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            peerManager.sendToPeer(peerId, {
              type: 'ERROR',
              message: err?.message ?? 'Aksi tidak valid.',
            });
          }
        },
        onGuestUndo: (peerId: string) => {
          const { gameState, mpPlayerPeerIds } = get();
          const activePeerId = mpPlayerPeerIds[gameState.currentTurnPlayerIndex];
          if (activePeerId !== peerId) return;
          applyAuthoritativeUndo();
        },
        onReaction: (reaction: ReactionPayload) => {
          pushReaction(reaction);
        },
        onError: (message: string) => {
          set({ mpStatus: 'error', mpError: message });
        },
      });

      const createGuestCallbacks = (isReconnect: boolean) => ({
        onConnected: () => {
          set({
            mpStatus: 'connected',
            mpError: null,
            mpHostDisconnected: false,
            mpSessionUpdatedAt: Date.now(),
          });
        },
        onLobbyUpdate: (code: string, players: LobbyPlayer[]) => {
          set({
            roomCode: code,
            mpLobbyPlayers: players,
            mpStatus: 'connected',
            mpHostDisconnected: false,
            mpSessionUpdatedAt: Date.now(),
            screen: 'menu',
          });
        },
        onGameStart: (
          gameState: GameState,
          playerPeerIds: (string | null)[],
          incomingSeriesWins?: Record<string, number>,
          hasTurnSnapshot?: boolean,
          isRejoin?: boolean
        ) => {
          const myPeerId = peerManager.getMyPeerId();
          const myIdx = myPeerId ? playerPeerIds.indexOf(myPeerId) : -1;
          set({
            gameState,
            mpPlayerPeerIds: playerPeerIds,
            mpMyPlayerIndex: myIdx >= 0 ? myIdx : null,
            mpRemoteHasSnapshot: !!hasTurnSnapshot,
            mpStatus: 'connected',
            mpHostDisconnected: false,
            mpSessionUpdatedAt: Date.now(),
            selectedResourceSlots: [],
            turnSnapshot: null,
            inspectedPlayerIndex: null,
            shelfViewingPlayerIndex: null,
            seriesWins: incomingSeriesWins ?? get().seriesWins,
            lastGameMode: gameState.gameMode ?? 'classic',
            showPowerUpRoll: !isRejoin && gameState.gameMode === 'special',
            actionToast: null,
            errorMessage: null,
            screen: 'game',
          });
        },
        onStateSync: (nextState: GameState, hasTurnSnapshot: boolean) => {
          const { gameState: prevState, lang, mpRole, mpMyPlayerIndex, seriesWins } = get();
          const nextSeriesWins = applySeriesWinIfFinished(prevState, nextState, seriesWins);
          const toast = buildOpponentActionToast(prevState, nextState, lang, mpRole, mpMyPlayerIndex);

          set({
            gameState: nextState,
            mpRemoteHasSnapshot: hasTurnSnapshot,
            mpStatus: 'connected',
            mpHostDisconnected: false,
            mpSessionUpdatedAt: Date.now(),
            selectedResourceSlots: [],
            seriesWins: nextSeriesWins,
            errorMessage: null,
          });

          showToast(toast);
        },
        onReaction: (reaction: ReactionPayload) => {
          pushReaction(reaction);
        },
        onHostTemporarilyLost: () => {
          set({ mpHostDisconnected: true });
        },
        onHostRestored: () => {
          set({ mpHostDisconnected: false, errorMessage: null });
        },
        onHostClosed: () => {
          peerManager.disconnect(false);
          set({
            mpRole: 'none',
            mpStatus: 'idle',
            mpError: 'Host menutup room atau koneksi terputus.',
            mpLobbyPlayers: [],
            mpMyPlayerIndex: null,
            mpPlayerPeerIds: [],
            mpRemoteHasSnapshot: false,
            mpSessionUpdatedAt: null,
            mpHostDisconnected: false,
            roomCode: null,
            seriesWins: {},
            activeReactions: [],
            actionToast: null,
            screen: 'menu',
          });
        },
        onError: (message: string) => {
          if (isReconnect) {
            peerManager.disconnect(false);
            set({
              mpRole: 'none',
              mpStatus: 'idle',
              mpError: message,
              mpLobbyPlayers: [],
              mpMyPlayerIndex: null,
              mpPlayerPeerIds: [],
              mpRemoteHasSnapshot: false,
              mpSessionUpdatedAt: null,
              mpHostDisconnected: false,
              roomCode: null,
              screen: 'menu',
            });
            return;
          }
          set({ mpStatus: 'error', mpError: message });
        },
      });

      return {
        screen: 'menu',
        roomCode: null,
        gameState: initializeGame(defaultSetup),
        selectedResourceSlots: [],
        lang: 'id',
        errorMessage: null,
        soundEnabled: true,
        musicEnabled: true,
        isSettingsOpen: false,
        isBotThinking: false,
        turnSnapshot: null,
        inspectedPlayerIndex: null,
        shelfViewingPlayerIndex: null,

        // Multiplayer initial state
        mpRole: 'none',
        mpStatus: 'idle',
        mpError: null,
        mpLobbyPlayers: [],
        mpMyPlayerIndex: null,
        mpPlayerPeerIds: [],
        mpRemoteHasSnapshot: false,
        mpPlayerName: 'Pemain 1',
        mpSessionUpdatedAt: null,
        mpHostDisconnected: false,

        // Social & session state
        seriesWins: {},
        lastDeckSize: undefined,
        lastGameMode: 'special',
        showPowerUpRoll: false,
        activeReactions: [],
        actionToast: null,

        setScreen: (screen) => set({ screen }),
        setRoomCode: (roomCode) => set({ roomCode }),
        clearMpError: () => set({ mpError: null }),
        dismissActionToast: () => set({ actionToast: null }),
        dismissPowerUpRoll: () => set({ showPowerUpRoll: false }),

        sendReaction: (emoji, text) => {
          const { gameState, mpRole, mpMyPlayerIndex } = get();
          const senderIdx =
            mpRole !== 'none' && mpMyPlayerIndex !== null
              ? mpMyPlayerIndex
              : gameState.currentTurnPlayerIndex;
          const senderName = gameState.players[senderIdx]?.name ?? 'Pemain';

          const reaction: ReactionPayload = {
            id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            senderName,
            senderIndex: senderIdx,
            emoji,
            text,
          };

          pushReaction(reaction);

          if (mpRole === 'host') {
            peerManager.broadcast({ type: 'REACTION', reaction });
          } else if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'REACTION', reaction });
          }
        },

        startNewGame: (options) => {
          if (get().mpRole !== 'none') {
            peerManager.disconnect();
          }

          const currentPlayers = get().gameState.players;
          const players = options?.players ??
            (options?.preserveSeries && currentPlayers.length >= 2
              ? currentPlayers.map((p) => ({
                  id: p.id,
                  name: p.name,
                  isBot: p.isBot,
                  botDifficulty: p.botDifficulty,
                }))
              : [
                  { id: 'p1', name: 'Pemain 1', isBot: false },
                  { id: 'p2', name: 'Bot Pintar', isBot: true, botDifficulty: 'greedy' as const },
                ]);
          const seed = options?.seed ?? Math.floor(Math.random() * 1000000);
          const deckSize = options?.deckSize ?? (options?.preserveSeries ? get().lastDeckSize : undefined);
          const gameMode: GameMode = options?.gameMode ?? (options?.preserveSeries ? get().lastGameMode : 'special');

          const newState = initializeGame({
            players,
            seed,
            deckSize,
            gameMode,
          });

          set({
            gameState: newState,
            selectedResourceSlots: [],
            errorMessage: null,
            isSettingsOpen: false,
            isBotThinking: false,
            turnSnapshot: null,
            inspectedPlayerIndex: null,
            shelfViewingPlayerIndex: null,
            roomCode: null,
            mpRole: 'none',
            mpStatus: 'idle',
            mpError: null,
            mpLobbyPlayers: [],
            mpMyPlayerIndex: null,
            mpPlayerPeerIds: [],
            mpRemoteHasSnapshot: false,
            mpSessionUpdatedAt: null,
            mpHostDisconnected: false,
            lastDeckSize: deckSize,
            lastGameMode: gameMode,
            showPowerUpRoll: gameMode === 'special',
            seriesWins: options?.preserveSeries ? get().seriesWins : {},
            actionToast: null,
          });

          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        },

        // ==========================================
        // MULTIPLAYER (Supabase Realtime Broadcast)
        // ==========================================
        openOnlineRoom: (hostName) => {
          const code = generateRoomCode();
          const cleanName = hostName.trim() || 'Host';

          set({
            roomCode: code,
            mpRole: 'host',
            mpStatus: 'connecting',
            mpError: null,
            mpLobbyPlayers: [],
            mpMyPlayerIndex: 0,
            mpPlayerPeerIds: [],
            mpRemoteHasSnapshot: false,
            mpPlayerName: cleanName,
            mpSessionUpdatedAt: Date.now(),
            mpHostDisconnected: false,
            seriesWins: {},
            activeReactions: [],
            actionToast: null,
          });

          peerManager.hostRoom(code, createHostCallbacks(code, cleanName, false));
        },

        joinOnlineRoom: (roomCode, guestName) => {
          const cleanCode = roomCode.trim().toUpperCase();
          const cleanName = guestName.trim() || 'Pemain 2';

          set({
            roomCode: cleanCode,
            mpRole: 'guest',
            mpStatus: 'connecting',
            mpError: null,
            mpLobbyPlayers: [],
            mpMyPlayerIndex: null,
            mpPlayerPeerIds: [],
            mpRemoteHasSnapshot: false,
            mpPlayerName: cleanName,
            mpSessionUpdatedAt: Date.now(),
            mpHostDisconnected: false,
            seriesWins: {},
            activeReactions: [],
            actionToast: null,
          });

          peerManager.joinRoom(cleanCode, cleanName, createGuestCallbacks(false));
        },

        reconnectOnlineRoom: () => {
          const { mpRole, roomCode, mpPlayerName, mpSessionUpdatedAt } = get();
          if (mpRole === 'none' || !roomCode) return;

          // Expire stale multiplayer sessions
          if (mpSessionUpdatedAt && Date.now() - mpSessionUpdatedAt > MP_SESSION_TTL_MS) {
            set({
              screen: 'menu',
              roomCode: null,
              mpRole: 'none',
              mpStatus: 'idle',
              mpError: null,
              mpLobbyPlayers: [],
              mpMyPlayerIndex: null,
              mpPlayerPeerIds: [],
              mpRemoteHasSnapshot: false,
              mpSessionUpdatedAt: null,
              mpHostDisconnected: false,
            });
            return;
          }

          if (peerManager.isActiveFor(roomCode, mpRole)) {
            return;
          }

          set({
            mpStatus: 'connecting',
            mpError: null,
            mpHostDisconnected: false,
          });

          if (mpRole === 'host') {
            const cleanName = mpPlayerName.trim() || 'Host';
            peerManager.hostRoom(roomCode, createHostCallbacks(roomCode, cleanName, true));
          } else {
            const cleanName = mpPlayerName.trim() || 'Pemain 2';
            peerManager.joinRoom(roomCode, cleanName, createGuestCallbacks(true));
          }
        },

        addLobbyBot: () => {
          const { mpRole, mpLobbyPlayers, roomCode } = get();
          if (mpRole !== 'host' || mpLobbyPlayers.length >= 4) return;
          const botNum = mpLobbyPlayers.filter((p) => p.isBot).length + 1;
          const botNames = ['Bot Tomat', 'Bot Wortel', 'Bot Kubis'];
          const newBot: LobbyPlayer = {
            peerId: `bot-${Date.now()}-${botNum}`,
            name: botNames[botNum - 1] ?? `Bot ${botNum}`,
            isHost: false,
            isBot: true,
            botDifficulty: 'greedy',
          };
          const updated = [...mpLobbyPlayers, newBot];
          set({ mpLobbyPlayers: updated });
          peerManager.broadcast({
            type: 'LOBBY_UPDATE',
            roomCode: roomCode ?? '',
            players: updated,
          });
        },

        removeLobbyPlayer: (peerId) => {
          const { mpRole, mpLobbyPlayers, roomCode } = get();
          if (mpRole !== 'host') return;
          const target = mpLobbyPlayers.find((p) => p.peerId === peerId);
          if (!target || target.isHost) return;
          const updated = mpLobbyPlayers.filter((p) => p.peerId !== peerId);
          set({ mpLobbyPlayers: updated });
          peerManager.broadcast({
            type: 'LOBBY_UPDATE',
            roomCode: roomCode ?? '',
            players: updated,
          });
        },

        startOnlineGame: (deckSize, gameMode = 'special') => {
          const { mpRole, mpLobbyPlayers } = get();
          if (mpRole !== 'host' || mpLobbyPlayers.length < 2) return;

          const players = mpLobbyPlayers.map((p, idx) => ({
            id: `p${idx + 1}`,
            name: p.name,
            isBot: !!p.isBot,
            botDifficulty: p.isBot ? (p.botDifficulty ?? 'greedy') : undefined,
          }));
          const playerPeerIds = mpLobbyPlayers.map((p) => (p.isBot ? null : p.peerId));
          const seed = Math.floor(Math.random() * 1000000);
          const newState = initializeGame({ players, seed, deckSize, gameMode });

          set({
            gameState: newState,
            mpMyPlayerIndex: 0,
            mpPlayerPeerIds: playerPeerIds,
            mpRemoteHasSnapshot: false,
            selectedResourceSlots: [],
            turnSnapshot: null,
            inspectedPlayerIndex: null,
            shelfViewingPlayerIndex: null,
            lastDeckSize: deckSize,
            lastGameMode: gameMode,
            showPowerUpRoll: gameMode === 'special',
            seriesWins: {},
            actionToast: null,
            errorMessage: null,
            screen: 'game',
          });

          peerManager.broadcast({
            type: 'GAME_START',
            gameState: newState,
            playerPeerIds,
            seriesWins: {},
          });

          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        },

        rematchOnlineGame: (deckSize) => {
          const { mpRole, mpLobbyPlayers, mpPlayerPeerIds, seriesWins, lastDeckSize, lastGameMode } =
            get();
          if (mpRole !== 'host' || mpLobbyPlayers.length < 2) return;

          const effectiveDeckSize = deckSize !== undefined ? deckSize : lastDeckSize;
          const players = mpLobbyPlayers.map((p, idx) => ({
            id: `p${idx + 1}`,
            name: p.name,
            isBot: !!p.isBot,
            botDifficulty: p.isBot ? (p.botDifficulty ?? 'greedy') : undefined,
          }));
          const peerIds =
            mpPlayerPeerIds.length === players.length
              ? mpPlayerPeerIds
              : mpLobbyPlayers.map((p) => (p.isBot ? null : p.peerId));
          const seed = Math.floor(Math.random() * 1000000);
          const newState = initializeGame({
            players,
            seed,
            deckSize: effectiveDeckSize,
            gameMode: lastGameMode,
          });

          set({
            gameState: newState,
            mpMyPlayerIndex: 0,
            mpPlayerPeerIds: peerIds,
            mpRemoteHasSnapshot: false,
            selectedResourceSlots: [],
            turnSnapshot: null,
            inspectedPlayerIndex: null,
            shelfViewingPlayerIndex: null,
            lastDeckSize: effectiveDeckSize,
            showPowerUpRoll: lastGameMode === 'special',
            actionToast: null,
            errorMessage: null,
            screen: 'game',
          });

          peerManager.broadcast({
            type: 'GAME_START',
            gameState: newState,
            playerPeerIds: peerIds,
            seriesWins,
          });

          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        },

        leaveOnlineRoom: () => {
          peerManager.disconnect(true);
          set({
            screen: 'menu',
            roomCode: null,
            mpRole: 'none',
            mpStatus: 'idle',
            mpError: null,
            mpLobbyPlayers: [],
            mpMyPlayerIndex: null,
            mpPlayerPeerIds: [],
            mpRemoteHasSnapshot: false,
            mpSessionUpdatedAt: null,
            mpHostDisconnected: false,
            selectedResourceSlots: [],
            turnSnapshot: null,
            seriesWins: {},
            activeReactions: [],
            actionToast: null,
          });
        },

        // ==========================================
        // GAMEPLAY ACTIONS
        // ==========================================
        selectResourceSlot: (slotIndex) => {
          const { gameState, selectedResourceSlots } = get();
          if (!canLocalUserAct()) return;
          if (gameState.hasTakenMainActionThisTurn) return;
          if (!gameState.market.resourceSlots[slotIndex]) return;

          if (selectedResourceSlots.includes(slotIndex)) {
            set({
              selectedResourceSlots: selectedResourceSlots.filter((idx) => idx !== slotIndex),
              errorMessage: null,
            });
            return;
          }

          const availableCount = gameState.market.resourceSlots.filter(Boolean).length;
          const allPilesEmpty = gameState.market.piles.every((p) => p.length === 0);
          const extraAllowance = gameState.extraVeggieAllowance ?? 0;
          const maxSelect =
            availableCount === 1 && allPilesEmpty
              ? 1
              : Math.min(2 + extraAllowance, availableCount);

          if (selectedResourceSlots.length >= maxSelect) {
            set({
              selectedResourceSlots: [...selectedResourceSlots.slice(0, maxSelect - 1), slotIndex],
              errorMessage: null,
            });
          } else {
            set({
              selectedResourceSlots: [...selectedResourceSlots, slotIndex],
              errorMessage: null,
            });
          }
        },

        useSkillRefreshMarket: () => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = { type: 'USE_SKILL_REFRESH_MARKET' };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({ selectedResourceSlots: [], errorMessage: null });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Skill tidak bisa digunakan.' });
          }
        },

        useSkillGrabThree: () => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = { type: 'USE_SKILL_GRAB_THREE' };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({ errorMessage: null });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Skill tidak bisa digunakan.' });
          }
        },

        useSkillSwapVeggie: (targetPlayerIndex, myResource, targetResource) => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = {
            type: 'USE_SKILL_SWAP_VEGGIE',
            targetPlayerIndex,
            myResource,
            targetResource,
          };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Gagal menukar sayur.' });
          }
        },

        useSkillGoldenTouch: () => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = { type: 'USE_SKILL_GOLDEN_TOUCH' };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Skill Sentuhan Emas tidak bisa dipakai.' });
          }
        },

        useSkillStealVeggie: (targetPlayerIndex, targetResource) => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = {
            type: 'USE_SKILL_STEAL_VEGGIE',
            targetPlayerIndex,
            targetResource,
          };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Gagal mencuri sayur.' });
          }
        },

        useSkillCloneVeggie: (myResource) => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;
          const action: GameAction = {
            type: 'USE_SKILL_CLONE_VEGGIE',
            myResource,
          };
          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            return;
          }
          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Gagal menggandakan sayur.' });
          }
        },

        confirmTakeResources: () => {
          const { gameState, selectedResourceSlots, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;

          const action: GameAction = {
            type: 'TAKE_RESOURCES',
            slotIndices: selectedResourceSlots as [number, number] | [number],
          };

          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({ selectedResourceSlots: [], errorMessage: null });
            return;
          }

          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
          }
        },

        takeScoringMarket: (slotIndex) => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;

          const action: GameAction = {
            type: 'TAKE_SCORING_MARKET',
            slotIndex,
          };

          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({ selectedResourceSlots: [], errorMessage: null });
            return;
          }

          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
          }
        },

        takeScoringPile: (pileIndex) => {
          const { gameState, mpRole } = get();
          if (!canLocalUserAct() || gameState.hasTakenMainActionThisTurn) return;

          const action: GameAction = {
            type: 'TAKE_SCORING_PILE',
            pileIndex,
          };

          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({ selectedResourceSlots: [], errorMessage: null });
            return;
          }

          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
          }
        },

        flipCard: (cardId) => {
          const { mpRole } = get();
          if (!canLocalUserAct()) return;

          const action: GameAction = {
            type: 'FLIP_CARD',
            cardId,
          };

          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            return;
          }

          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Gagal membalik kartu' });
          }
        },

        undoCurrentTurnAction: () => {
          const { turnSnapshot, mpRole, mpRemoteHasSnapshot } = get();
          if (!canLocalUserAct()) return;

          if (mpRole === 'guest') {
            if (!mpRemoteHasSnapshot) return;
            peerManager.sendToHost({ type: 'PLAYER_UNDO' });
            return;
          }

          if (!turnSnapshot) return;
          applyAuthoritativeUndo();
        },

        endTurn: () => {
          const { mpRole } = get();
          if (!canLocalUserAct()) return;

          const action: GameAction = { type: 'END_TURN' };

          if (mpRole === 'guest') {
            peerManager.sendToHost({ type: 'PLAYER_ACTION', action });
            set({
              selectedResourceSlots: [],
              shelfViewingPlayerIndex: null,
              actionToast: null,
              errorMessage: null,
            });
            return;
          }

          try {
            set({ actionToast: null });
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Tidak dapat mengakhiri giliran' });
          }
        },

        executeBotTurnIfNeeded: () => {
          const { gameState, lang, isBotThinking, mpRole } = get();
          if (mpRole === 'guest') return;
          if (gameState.phase === 'game_over' || isBotThinking) return;

          const activePlayer = gameState.players[gameState.currentTurnPlayerIndex];
          if (!activePlayer || !activePlayer.isBot) return;

          set({ isBotThinking: true });

          try {
            const bot = createBot(activePlayer.botDifficulty ?? 'greedy');
            const actions = bot.planTurn(gameState, gameState.currentTurnPlayerIndex);

            let currentState = gameState;
            let actionIdx = 0;

            const executeNextAction = () => {
              if (actionIdx >= actions.length) {
                set({ isBotThinking: false });
                const nextActivePlayer = currentState.players[currentState.currentTurnPlayerIndex];
                if (nextActivePlayer && nextActivePlayer.isBot && currentState.phase !== 'game_over') {
                  setTimeout(() => {
                    get().executeBotTurnIfNeeded();
                  }, 600);
                }
                return;
              }

              const prevState = currentState;
              const action = actions[actionIdx];
              currentState = gameReducer(currentState, action, lang);
              actionIdx++;

              const nextSeriesWins = applySeriesWinIfFinished(prevState, currentState, get().seriesWins);
              const toast = buildOpponentActionToast(
                prevState,
                currentState,
                lang,
                get().mpRole,
                get().mpMyPlayerIndex
              );

              set({ gameState: currentState, seriesWins: nextSeriesWins });
              showToast(toast);

              if (get().mpRole === 'host') {
                peerManager.broadcast({
                  type: 'STATE_SYNC',
                  gameState: currentState,
                  hasTurnSnapshot: false,
                });
              }

              setTimeout(executeNextAction, 480);
            };

            setTimeout(executeNextAction, 500);
          } catch (err: any) {
            set({
              isBotThinking: false,
              errorMessage: err?.message ?? 'Bot mengalami kesalahan.',
            });
          }
        },

        setLang: (lang) => set({ lang }),
        toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
        toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
        setSettingsOpen: (open) => set({ isSettingsOpen: open }),
        setInspectedPlayerIndex: (index) => set({ inspectedPlayerIndex: index }),
        setShelfViewingPlayerIndex: (index) => set({ shelfViewingPlayerIndex: index }),
        clearError: () => set({ errorMessage: null }),
      };
    },
    {
      name: 'point-salad-game-state',
      storage: createJSONStorage(() => createTabAwareStorage()),
      partialize: (state) => ({
        screen: state.mpRole !== 'none' ? state.screen : 'menu',
        roomCode: state.roomCode,
        gameState: state.gameState,
        selectedResourceSlots: state.selectedResourceSlots,
        lang: state.lang,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        turnSnapshot: state.turnSnapshot,
        mpRole: state.mpRole,
        mpPlayerName: state.mpPlayerName,
        mpLobbyPlayers: state.mpLobbyPlayers,
        mpMyPlayerIndex: state.mpMyPlayerIndex,
        mpPlayerPeerIds: state.mpPlayerPeerIds,
        mpSessionUpdatedAt: state.mpSessionUpdatedAt,
        seriesWins: state.seriesWins,
        lastDeckSize: state.lastDeckSize,
        lastGameMode: state.lastGameMode,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__gameStore = useGameStore;
}
