import { create } from 'zustand';
import {
  GameAction,
  GameState,
  initializeGame,
  gameReducer,
  SetupOptions,
} from '../../engine';

interface GameStoreState {
  gameState: GameState;
  selectedResourceSlots: number[];
  lang: 'id' | 'en';
  errorMessage: string | null;

  // Actions
  startNewGame: (options?: Partial<SetupOptions>) => void;
  selectResourceSlot: (slotIndex: number) => void;
  confirmTakeResources: () => void;
  takeScoringMarket: (slotIndex: number) => void;
  takeScoringPile: (pileIndex: number) => void;
  flipCard: (cardId: string) => void;
  endTurn: () => void;
  setLang: (lang: 'id' | 'en') => void;
  clearError: () => void;
}

const defaultSetup: SetupOptions = {
  players: [
    { id: 'p1', name: 'Pemain 1' },
    { id: 'p2', name: 'Pemain 2' },
  ],
  seed: Math.floor(Math.random() * 1000000),
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: initializeGame(defaultSetup),
  selectedResourceSlots: [],
  lang: 'id',
  errorMessage: null,

  startNewGame: (options) => {
    const players = options?.players ?? [
      { id: 'p1', name: 'Pemain 1' },
      { id: 'p2', name: 'Pemain 2' },
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
    });
  },

  selectResourceSlot: (slotIndex) => {
    const { gameState, selectedResourceSlots } = get();
    if (gameState.phase === 'game_over') return;
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
    const { gameState, selectedResourceSlots, lang } = get();
    if (gameState.hasTakenMainActionThisTurn) return;

    try {
      const action: GameAction = {
        type: 'TAKE_RESOURCES',
        slotIndices: selectedResourceSlots as [number, number] | [number],
      };
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  takeScoringMarket: (slotIndex) => {
    const { gameState, lang } = get();
    if (gameState.hasTakenMainActionThisTurn) return;

    try {
      const action: GameAction = {
        type: 'TAKE_SCORING_MARKET',
        slotIndex,
      };
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  takeScoringPile: (pileIndex) => {
    const { gameState, lang } = get();
    if (gameState.hasTakenMainActionThisTurn) return;

    try {
      const action: GameAction = {
        type: 'TAKE_SCORING_PILE',
        pileIndex,
      };
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Aksi tidak valid' });
    }
  },

  flipCard: (cardId) => {
    const { gameState, lang } = get();
    try {
      const action: GameAction = {
        type: 'FLIP_CARD',
        cardId,
      };
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Gagal membalik kartu' });
    }
  },

  endTurn: () => {
    const { gameState, lang } = get();
    try {
      const action: GameAction = {
        type: 'END_TURN',
      };
      const nextState = gameReducer(gameState, action, lang);
      set({
        gameState: nextState,
        selectedResourceSlots: [],
        errorMessage: null,
      });
    } catch (err: any) {
      set({ errorMessage: err?.message ?? 'Tidak dapat mengakhiri giliran' });
    }
  },

  setLang: (lang) => set({ lang }),
  clearError: () => set({ errorMessage: null }),
}));
