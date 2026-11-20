/**
 * Point Salad / Panen Sayur — Game Simulation Script
 * Runs automated Bot vs Bot games to verify balance, score distributions, and engine stability.
 */

import { initializeGame } from '../src/engine/setup';
import { gameReducer } from '../src/engine/actions';
import { createBot } from '../src/engine/bot';
import { GameState } from '../src/engine/types';

interface SimStats {
  totalGames: number;
  totalTurns: number;
  scores: number[];
  winnerScores: number[];
  botWins: Record<string, number>;
  resourceFrequency: Record<string, number>;
}

function runOneGame(seed: number, playerConfigs: { id: string; name: string; isBot: boolean; botDifficulty: 'easy' | 'greedy' }[]): {
  turns: number;
  winner: string;
  winnerScore: number;
  allScores: number[];
  finalState: GameState;
} {
  let state = initializeGame({
    players: playerConfigs,
    seed,
  });

  const MAX_TURNS = 200;
  let safetyLoop = 0;

  while (state.phase !== 'game_over' && safetyLoop < MAX_TURNS) {
    safetyLoop++;
    const activePlayerIndex = state.currentTurnPlayerIndex;
    const activePlayer = state.players[activePlayerIndex];
    const difficulty = activePlayer.botDifficulty ?? 'greedy';
    const bot = createBot(difficulty);

    const turnActions = bot.planTurn(state, activePlayerIndex);
    if (!turnActions || turnActions.length === 0) {
      break;
    }

    for (const action of turnActions) {
      if (state.phase === 'game_over') break;
      state = gameReducer(state, action);
    }
  }

  const scores = state.finalScores ?? [];
  const topWinner = scores.find((s) => s.rank === 1)?.playerName ?? 'Unknown';
  const winnerScore = scores.find((s) => s.rank === 1)?.totalScore ?? 0;

  return {
    turns: state.turnCount,
    winner: topWinner,
    winnerScore,
    allScores: scores.map((r) => r.totalScore),
    finalState: state,
  };
}

export function runSimulation(numGames: number = 300) {
  console.log(`\n=======================================================`);
  console.log(`🥗 PANEN SAYUR (POINT SALAD) — SIMULATION ENGINE`);
  console.log(`Running ${numGames} automated Bot vs Bot games...`);
  console.log(`=======================================================\n`);

  const startTime = Date.now();
  const stats: SimStats = {
    totalGames: numGames,
    totalTurns: 0,
    scores: [],
    winnerScores: [],
    botWins: {},
    resourceFrequency: {},
  };

  for (let i = 0; i < numGames; i++) {
    const seed = 1000 + i * 37;
    // 3-player match: 2 Greedy Bots vs 1 Easy Bot
    const playerConfigs = [
      { id: 'p1', name: 'Greedy-1', isBot: true, botDifficulty: 'greedy' as const },
      { id: 'p2', name: 'Greedy-2', isBot: true, botDifficulty: 'greedy' as const },
      { id: 'p3', name: 'Easy-1', isBot: true, botDifficulty: 'easy' as const },
    ];

    const result = runOneGame(seed, playerConfigs);
    stats.totalTurns += result.turns;
    stats.scores.push(...result.allScores);
    stats.winnerScores.push(result.winnerScore);

    stats.botWins[result.winner] = (stats.botWins[result.winner] || 0) + 1;

    // Track resource frequency
    for (const player of result.finalState.players) {
      for (const [res, count] of Object.entries(player.resources)) {
        stats.resourceFrequency[res] = (stats.resourceFrequency[res] || 0) + count;
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgTurns = (stats.totalTurns / numGames).toFixed(1);
  const avgScore = (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1);
  const avgWinnerScore = (stats.winnerScores.reduce((a, b) => a + b, 0) / stats.winnerScores.length).toFixed(1);
  const minScore = Math.min(...stats.scores);
  const maxScore = Math.max(...stats.scores);

  console.log(`Completed ${numGames} games in ${duration}s!`);
  console.log(`-------------------------------------------------------`);
  console.log(`📊 STATISTIK UTAMA:`);
  console.log(`- Rata-rata Durasi Permainan : ${avgTurns} giliran`);
  console.log(`- Rata-rata Skor Semua Pemain: ${avgScore} poin`);
  console.log(`- Rata-rata Skor Pemenang    : ${avgWinnerScore} poin`);
  console.log(`- Rentang Skor (Min / Max)   : ${minScore} / ${maxScore} poin`);
  console.log(`-------------------------------------------------------`);
  console.log(`🏆 DISTRIBUSI KEMENANGAN:`);
  for (const [bot, wins] of Object.entries(stats.botWins)) {
    const pct = ((wins / numGames) * 100).toFixed(1);
    console.log(`- ${bot.padEnd(12)}: ${wins} menang (${pct}%)`);
  }
  console.log(`-------------------------------------------------------`);
  console.log(`🥦 DISTRIBUSI DRAF SAYUR (Total Terkumpul):`);
  for (const [res, count] of Object.entries(stats.resourceFrequency)) {
    console.log(`- ${res.padEnd(10)}: ${count} kartu`);
  }
  console.log(`=======================================================\n`);
}

// Execute directly
runSimulation(300);
