import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  GameAction,
  GameState,
  initializeGame,
  gameReducer,
  SetupOptions,
  createBot,
} from '../../engine';
import {
  LobbyPlayer,
  MultiplayerRole,
  MultiplayerStatus,
  peerManager,
} from '../../multiplayer/peerManager';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
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

  // Navigation & Setup Actions
  setScreen: (screen: 'menu' | 'game') => void;
  setRoomCode: (code: string | null) => void;
  startNewGame: (options?: Partial<SetupOptions>) => void;

  // Multiplayer Actions
  openOnlineRoom: (hostName: string) => void;
  joinOnlineRoom: (roomCode: string, guestName: string) => void;
  addLobbyBot: () => void;
  removeLobbyPlayer: (peerId: string) => void;
  startOnlineGame: () => void;
  leaveOnlineRoom: () => void;
  clearMpError: () => void;

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
      // Helper: check if local user is allowed to act right now
      const canLocalUserAct = (): boolean => {
        const { mpRole, mpMyPlayerIndex, gameState, isBotThinking } = get();
        if (gameState.phase === 'game_over' || isBotThinking) return false;
        if (mpRole === 'none') return true;
        return mpMyPlayerIndex !== null && gameState.currentTurnPlayerIndex === mpMyPlayerIndex;
      };

      // Helper: apply an action on Host (or local solo) and broadcast if Host
      const applyAuthoritativeAction = (action: GameAction) => {
        const { gameState, lang, turnSnapshot, mpRole } = get();
        const isEndTurn = action.type === 'END_TURN';
        const snapshot = isEndTurn ? null : (turnSnapshot ?? gameState);
        const nextState = gameReducer(gameState, action, lang);

        set({
          gameState: nextState,
          turnSnapshot: snapshot,
          selectedResourceSlots: [],
          shelfViewingPlayerIndex: isEndTurn ? null : get().shelfViewingPlayerIndex,
          errorMessage: null,
        });

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

      // Helper: undo on Host (or local solo) and broadcast if Host
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

        setScreen: (screen) => set({ screen }),
        setRoomCode: (roomCode) => set({ roomCode }),
        clearMpError: () => set({ mpError: null }),

        startNewGame: (options) => {
          // Starting a local/bot game disconnects any online room
          if (get().mpRole !== 'none') {
            peerManager.disconnect();
          }

          const players = options?.players ?? [
            { id: 'p1', name: 'Pemain 1', isBot: false },
            { id: 'p2', name: 'Bot Pintar', isBot: true, botDifficulty: 'greedy' },
          ];
          const seed = options?.seed ?? Math.floor(Math.random() * 1000000);

          const newState = initializeGame({
            players,
            seed,
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
          });

          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        },

        // ==========================================
        // MULTIPLAYER (PeerJS WebRTC Host-Authoritative)
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
          });

          peerManager.hostRoom(code, {
            onReady: (hostPeerId) => {
              const initialPlayers: LobbyPlayer[] = [
                { peerId: hostPeerId, name: cleanName, isHost: true },
              ];
              set({
                mpStatus: 'connected',
                mpLobbyPlayers: initialPlayers,
                mpError: null,
              });
            },
            onGuestJoin: (peerId, guestName) => {
              const { mpLobbyPlayers, roomCode: activeCode, screen } = get();
              if (screen === 'game') {
                peerManager.sendToPeer(peerId, {
                  type: 'ERROR',
                  message: 'Permainan di room ini sudah dimulai.',
                });
                return;
              }
              if (mpLobbyPlayers.length >= 4) {
                peerManager.sendToPeer(peerId, {
                  type: 'ERROR',
                  message: 'Room sudah penuh (maksimal 4 pemain).',
                });
                return;
              }
              const exists = mpLobbyPlayers.some((p) => p.peerId === peerId);
              const updated = exists
                ? mpLobbyPlayers
                : [
                    ...mpLobbyPlayers,
                    { peerId, name: guestName.trim() || `Pemain ${mpLobbyPlayers.length + 1}`, isHost: false },
                  ];
              set({ mpLobbyPlayers: updated });
              peerManager.broadcast({
                type: 'LOBBY_UPDATE',
                roomCode: activeCode ?? code,
                players: updated,
              });
            },
            onGuestLeave: (peerId) => {
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
                  errorMessage: 'Salah satu pemain terputus dari room.',
                });
              }
            },
            onGuestAction: (peerId, action) => {
              const { gameState, mpPlayerPeerIds } = get();
              const activePeerId = mpPlayerPeerIds[gameState.currentTurnPlayerIndex];
              if (activePeerId !== peerId) return; // Enforce turn authority
              try {
                applyAuthoritativeAction(action);
              } catch (err: any) {
                peerManager.sendToPeer(peerId, {
                  type: 'ERROR',
                  message: err?.message ?? 'Aksi tidak valid.',
                });
              }
            },
            onGuestUndo: (peerId) => {
              const { gameState, mpPlayerPeerIds } = get();
              const activePeerId = mpPlayerPeerIds[gameState.currentTurnPlayerIndex];
              if (activePeerId !== peerId) return;
              applyAuthoritativeUndo();
            },
            onError: (message) => {
              set({ mpStatus: 'error', mpError: message });
            },
          });
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
          });

          peerManager.joinRoom(cleanCode, cleanName, {
            onConnected: () => {
              set({ mpStatus: 'connected', mpError: null });
            },
            onLobbyUpdate: (code, players) => {
              set({
                roomCode: code,
                mpLobbyPlayers: players,
                mpStatus: 'connected',
              });
            },
            onGameStart: (gameState, playerPeerIds) => {
              const myPeerId = peerManager.getMyPeerId();
              const myIdx = myPeerId ? playerPeerIds.indexOf(myPeerId) : -1;
              set({
                gameState,
                mpPlayerPeerIds: playerPeerIds,
                mpMyPlayerIndex: myIdx >= 0 ? myIdx : null,
                mpRemoteHasSnapshot: false,
                selectedResourceSlots: [],
                turnSnapshot: null,
                inspectedPlayerIndex: null,
                shelfViewingPlayerIndex: null,
                errorMessage: null,
                screen: 'game',
              });
            },
            onStateSync: (gameState, hasTurnSnapshot) => {
              set({
                gameState,
                mpRemoteHasSnapshot: hasTurnSnapshot,
                selectedResourceSlots: [],
                errorMessage: null,
              });
            },
            onHostClosed: () => {
              peerManager.disconnect();
              set({
                mpRole: 'none',
                mpStatus: 'idle',
                mpError: 'Host menutup room atau koneksi terputus.',
                mpLobbyPlayers: [],
                mpMyPlayerIndex: null,
                mpPlayerPeerIds: [],
                mpRemoteHasSnapshot: false,
                roomCode: null,
                screen: 'menu',
              });
            },
            onError: (message) => {
              set({ mpStatus: 'error', mpError: message });
            },
          });
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

        startOnlineGame: () => {
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
          const newState = initializeGame({ players, seed });

          set({
            gameState: newState,
            mpMyPlayerIndex: 0,
            mpPlayerPeerIds: playerPeerIds,
            mpRemoteHasSnapshot: false,
            selectedResourceSlots: [],
            turnSnapshot: null,
            inspectedPlayerIndex: null,
            shelfViewingPlayerIndex: null,
            errorMessage: null,
            screen: 'game',
          });

          peerManager.broadcast({
            type: 'GAME_START',
            gameState: newState,
            playerPeerIds,
          });

          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        },

        leaveOnlineRoom: () => {
          peerManager.disconnect();
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
            selectedResourceSlots: [],
            turnSnapshot: null,
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
          const maxSelect = availableCount === 1 && allPilesEmpty ? 1 : 2;

          if (selectedResourceSlots.length >= maxSelect) {
            set({
              selectedResourceSlots: [selectedResourceSlots[0], slotIndex],
              errorMessage: null,
            });
          } else {
            set({
              selectedResourceSlots: [...selectedResourceSlots, slotIndex],
              errorMessage: null,
            });
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
            set({ selectedResourceSlots: [], shelfViewingPlayerIndex: null, errorMessage: null });
            return;
          }

          try {
            applyAuthoritativeAction(action);
          } catch (err: any) {
            set({ errorMessage: err?.message ?? 'Tidak dapat mengakhiri giliran' });
          }
        },

        executeBotTurnIfNeeded: () => {
          const { gameState, lang, isBotThinking, mpRole } = get();
          // Only local solo or Host executes bot turns
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

              const action = actions[actionIdx];
              currentState = gameReducer(currentState, action, lang);
              actionIdx++;
              set({ gameState: currentState });

              if (get().mpRole === 'host') {
                peerManager.broadcast({
                  type: 'STATE_SYNC',
                  gameState: currentState,
                  hasTurnSnapshot: false,
                });
              }

              setTimeout(executeNextAction, 450);
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
        toggleMusic: () =>
          set((state) => ({
            musicEnabled: !state.musicEnabled,
            // If user explicitly turns music back on while master sound was muted, unmute master sound too
            soundEnabled: !state.musicEnabled ? true : state.soundEnabled,
          })),
        setSettingsOpen: (open) => set({ isSettingsOpen: open }),
        setInspectedPlayerIndex: (index) => set({ inspectedPlayerIndex: index }),
        setShelfViewingPlayerIndex: (index) => set({ shelfViewingPlayerIndex: index }),
        clearError: () => set({ errorMessage: null }),
      };
    },
    {
      name: 'point-salad-game-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gameState: state.gameState,
        selectedResourceSlots: state.selectedResourceSlots,
        lang: state.lang,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        turnSnapshot: state.turnSnapshot,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__gameStore = useGameStore;
}
