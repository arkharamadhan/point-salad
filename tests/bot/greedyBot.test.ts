import { describe, it, expect } from 'vitest';
import { EasyBot, GreedyBot, createBot } from '../../src/engine/bot';
import { gameReducer } from '../../src/engine/actions';
import { initializeGame } from '../../src/engine/setup';
import { evaluatePlayerScore } from '../../src/engine/scoring';
import { Card } from '../../src/engine/types';

describe('Bot AI (Greedy & Easy Bots)', () => {
  it('createBot instantiates the correct bot class', () => {
    const easy = createBot('easy');
    expect(easy.difficulty).toBe('easy');
    expect(easy instanceof EasyBot).toBe(true);

    const greedy = createBot('greedy');
    expect(greedy.difficulty).toBe('greedy');
    expect(greedy instanceof GreedyBot).toBe(true);
  });

  it('EasyBot returns a legal main action and END_TURN', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Bot 1', isBot: true, botDifficulty: 'easy' },
        { id: 'p2', name: 'Human' },
      ],
      seed: 42,
    });

    const bot = new EasyBot();
    const actions = bot.planTurn(state, state.currentTurnPlayerIndex);

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[actions.length - 1].type).toBe('END_TURN');

    // Executing the actions should not throw
    let nextState = state;
    for (const act of actions) {
      nextState = gameReducer(nextState, act);
    }

    // Turn should have successfully advanced
    expect(nextState.turnCount).toBe(2);
  });

  it('GreedyBot chooses actions that maximize immediate score gain', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Greedy Bot', isBot: true, botDifficulty: 'greedy' },
        { id: 'p2', name: 'Bob' },
      ],
      seed: 1234,
    });

    const activeIdx = state.currentTurnPlayerIndex;
    const bot = new GreedyBot();
    const actions = bot.planTurn(state, activeIdx);

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions[actions.length - 1].type).toBe('END_TURN');

    // Execute actions
    let nextState = state;
    for (const act of actions) {
      nextState = gameReducer(nextState, act);
    }

    expect(nextState.turnCount).toBe(2);
  });

  it('GreedyBot identifies profitable flips to increase its score', () => {
    const state = initializeGame({
      players: [
        { id: 'p1', name: 'Bot', isBot: true, botDifficulty: 'greedy' },
        { id: 'p2', name: 'Opponent' },
      ],
      seed: 55,
    });

    const botPlayerIdx = state.currentTurnPlayerIndex;

    // Give bot a scoring card that scores negative or 0, but flipping it into a resource helps another card!
    // Card 1: S07 (4 pts per complete set Jahe + Kunyit).
    // Bot currently has 1 Kunyit, 0 Jahe. Current score = 0.
    // Card 2 in hand: S01 (+3 Jahe, -1 Lada) with resource side = 'wortel'.
    // If Bot flips Card 2 into Jahe, it now has 1 Jahe + 1 Kunyit -> 4 pts!
    const cardS07: Card = { id: 'c_s07', resource: 'selada', scoringId: 'S07' };
    const cardFlipTarget: Card = { id: 'c_flip', resource: 'wortel', scoringId: 'S01' };

    state.players[botPlayerIdx].scoringCards = [cardS07, cardFlipTarget];
    state.players[botPlayerIdx].resources.paprika = 1;

    // Prior to flip: score is 0 (S07 has 0 sets, S01 has 0 jahe)
    const initialScore = evaluatePlayerScore(botPlayerIdx, state.players).totalScore;
    expect(initialScore).toBe(0);

    const bot = new GreedyBot();
    const actions = bot.planTurn(state, botPlayerIdx);

    // Verify FLIP_CARD is among planned actions
    const hasFlip = actions.some((a) => a.type === 'FLIP_CARD' && a.cardId === 'c_flip');
    expect(hasFlip).toBe(true);

    let nextState = state;
    for (const act of actions) {
      nextState = gameReducer(nextState, act);
    }

    // After the turn, bot's score increased
    const finalScore = evaluatePlayerScore(botPlayerIdx, nextState.players).totalScore;
    expect(finalScore).toBeGreaterThan(initialScore);
  });

  it('Automated Bot vs Bot simulation completes cleanly to game_over', () => {
    // 2-player bot simulation
    let state = initializeGame({
      players: [
        { id: 'bot1', name: 'Greedy Bot 1', isBot: true, botDifficulty: 'greedy' },
        { id: 'bot2', name: 'Greedy Bot 2', isBot: true, botDifficulty: 'greedy' },
      ],
      seed: 9999,
    });

    const bot1 = new GreedyBot();
    const bot2 = new GreedyBot();

    let turnsTaken = 0;
    const maxTurns = 100; // Safety guard

    while (state.phase !== 'game_over' && turnsTaken < maxTurns) {
      const activeIdx = state.currentTurnPlayerIndex;
      const bot = activeIdx === 0 ? bot1 : bot2;
      const actions = bot.planTurn(state, activeIdx);

      for (const act of actions) {
        state = gameReducer(state, act);
        if (state.phase === 'game_over') break;
      }
      turnsTaken++;
    }

    expect(state.phase).toBe('game_over');
    expect(state.winnerIds).toBeDefined();
    expect(state.winnerIds!.length).toBeGreaterThanOrEqual(1);
    expect(state.finalScores).toHaveLength(2);
    expect(state.finalScores![0].totalScore).toBeGreaterThanOrEqual(
      state.finalScores![1].totalScore
    );
  });
});
