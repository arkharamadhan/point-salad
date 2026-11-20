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

interface GameStoreState {
  screen: 'menu' | 'game';
  roomCode: string | null;
  gameState: GameState;
  selectedResourceSlots: number[];
  lang: 'id' | 'en';
  errorMessage: string | null;
  soundEnabled: boolean;
  isSettingsOpen: boolean;
  isBotThinking: boolean;
  turnSnapshot: GameState | null;
  inspectedPlayerIndex: number | null;
  shelfViewingPlayerIndex: number | null;

  // Actions
  setScreen: (screen: 'menu' | 'game') => void;
  setRoomCode: (code: string | null) => void;
  startNewGame: (options?: Partial<SetupOptions>) => void;
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
    (set, get) => ({
      screen: 'menu',
      roomCode: null,
      gameState: initializeGame(defaultSetup),
      selectedResourceSlots: [],
      lang: 'id',
      errorMessage: null,
      soundEnabled: true,
      isSettingsOpen: false,
      isBotThinking: false,
      turnSnapshot: null,
      inspectedPlayerIndex: null,
      shelfViewingPlayerIndex: null,

      setScreen: (screen) => set({ screen }),
      setRoomCode: (roomCode) => set({ roomCode }),

      startNewGame: (options) => {
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
        });

        // Check if initial starting player is a bot
        setTimeout(() => {
          get().executeBotTurnIfNeeded();
        }, 500);
      },

  selectResourceSlot: (slotIndex) => {
    const { gameState, selectedResourceSlots, isBotThinking } = get();
    if (gameState.phase === 'game_over' || isBotThinking) return;
    if (gameState.hasTakenMainActionThisTurn) return;

    // Check if slot has card
    if (!gameState.market.resourceSlots[slotIndex]) return;

    // Toggle selection
    if (selectedResourceSlots.includes(slotIndex)) {
      set({
        selectedResourceSlots: selectedResourceSlots.filter((idx) => idx !== slotIndex),
        errorMessage: null,
      });
      return;
    }

    const availableCount = gameState.market.resourceSlots.filter(Boolean).length;
    const allPilesEmpty = gameState.market.piles.every((p) => p.length === 0);

    // If only 1 resource remains when piles are empty, max selection is 1
    const maxSelect = availableCount === 1 && allPilesEmpty ? 1 : 2;

    if (selectedResourceSlots.length >= maxSelect) {
      // Replace second selection
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
    const { gameState, selectedResourceSlots, lang, isBotThinking, turnSnapshot } = get();
    if (gameState.hasTakenMainActionThisTurn || isBotThinking) return;

    try {
      const action: GameAction = {
        type: 'TAKE_RESOURCES',
        slotIndices: selectedResourceSlots as [number, number] | [number],
      };
      const snapshot = turnSnapshot ?? gameState;
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        turnSnapshot: snapshot,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  takeScoringMarket: (slotIndex) => {
    const { gameState, lang, isBotThinking, turnSnapshot } = get();
    if (gameState.hasTakenMainActionThisTurn || isBotThinking) return;

    try {
      const action: GameAction = {
        type: 'TAKE_SCORING_MARKET',
        slotIndex,
      };
      const snapshot = turnSnapshot ?? gameState;
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        turnSnapshot: snapshot,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  takeScoringPile: (pileIndex) => {
    const { gameState, lang, isBotThinking, turnSnapshot } = get();
    if (gameState.hasTakenMainActionThisTurn || isBotThinking) return;

    try {
      const action: GameAction = {
        type: 'TAKE_SCORING_PILE',
        pileIndex,
      };
      const snapshot = turnSnapshot ?? gameState;
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        turnSnapshot: snapshot,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  flipCard: (cardId) => {
    const { gameState, lang, isBotThinking, turnSnapshot } = get();
    if (isBotThinking) return;

    try {
      const action: GameAction = {
        type: 'FLIP_CARD',
        cardId,
      };
      const snapshot = turnSnapshot ?? gameState;
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        turnSnapshot: snapshot,
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Gagal membalik kartu' });
    }
  },

  undoCurrentTurnAction: () => {
    const { turnSnapshot, isBotThinking } = get();
    if (isBotThinking || !turnSnapshot) return;

    set({
      gameState: turnSnapshot,
      turnSnapshot: null,
      selectedResourceSlots: [],
      errorMessage: null,
    });
  },

      endTurn: () => {
        const { gameState, lang, isBotThinking } = get();
        if (isBotThinking) return;

        try {
          const action: GameAction = {
            type: 'END_TURN',
          };
          const nextState = gameReducer(gameState, action, lang);
          set({
            gameState: nextState,
            turnSnapshot: null,
            selectedResourceSlots: [],
            shelfViewingPlayerIndex: null,
            errorMessage: null,
          });

          // Trigger bot if next player is bot
          setTimeout(() => {
            get().executeBotTurnIfNeeded();
          }, 500);
        } catch (err: any) {
          set({ errorMessage: err?.message ?? 'Tidak dapat mengakhiri giliran' });
        }
      },

  executeBotTurnIfNeeded: () => {
    const { gameState, lang, isBotThinking } = get();
    if (gameState.phase === 'game_over' || isBotThinking) return;

    const activePlayer = gameState.players[gameState.currentTurnPlayerIndex];
    if (!activePlayer || !activePlayer.isBot) return;

    set({ isBotThinking: true });

    try {
      const bot = createBot(activePlayer.botDifficulty ?? 'greedy');
      const actions = bot.planTurn(gameState, gameState.currentTurnPlayerIndex);

      // Execute bot actions sequentially with gentle delay
      let currentState = gameState;
      let actionIdx = 0;

      const executeNextAction = () => {
        if (actionIdx >= actions.length) {
          set({ isBotThinking: false });
          // If the subsequent player is also a bot, trigger it
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

        setTimeout(executeNextAction, 400);
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
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setInspectedPlayerIndex: (index) => set({ inspectedPlayerIndex: index }),
      setShelfViewingPlayerIndex: (index) => set({ shelfViewingPlayerIndex: index }),
      clearError: () => set({ errorMessage: null }),
    }),
    {
      name: 'point-salad-game-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gameState: state.gameState,
        selectedResourceSlots: state.selectedResourceSlots,
        lang: state.lang,
        soundEnabled: state.soundEnabled,
        turnSnapshot: state.turnSnapshot,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__gameStore = useGameStore;
}

