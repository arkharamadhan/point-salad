/**
 * Procedural "Fun Enjot" Background Music Synthesizer (Web Audio API)
 * Upbeat, bouncy kitchen/market marimba + plucked bass + ukulele offbeat chords + light groove percussion.
 * Zero external audio assets required.
 */

import { getAudioContext } from './soundEffects';

// Note frequency helper (MIDI note number -> Hz)
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// MIDI note constants for clean composition
const _ = 0; // rest
const C3 = 48, D3 = 50, E3 = 52, F3 = 53, G3 = 55, A3 = 57, B3 = 59;
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71;
const C5 = 72, D5 = 74, E5 = 76, F5 = 77, G5 = 79, A5 = 81;

interface BarData {
  // 8 eighth-note steps per bar
  melody: number[];
  // 8 eighth-note steps per bar
  bass: number[];
  // Chord triad/seventh for offbeat ukulele skank
  chord: number[];
}

// 16-bar cheerful, bouncy C-major groove (Section A + Section B)
const SONG_BARS: BarData[] = [
  // === SECTION A (Bars 1-8): Sunny, playful veggie market bounce ===
  // Bar 1: C
  {
    melody: [E5, _, G5, E5, C5, _, D5, E5],
    bass:   [C3, _, _, G3, C3, _, G3, _],
    chord:  [E4, G4, C5],
  },
  // Bar 2: G
  {
    melody: [D5, _, B4, G4, A4, B4, D5, _],
    bass:   [G3, _, _, D3, G3, _, D3, _],
    chord:  [D4, G4, B4],
  },
  // Bar 3: Am
  {
    melody: [C5, _, E5, C5, A4, _, C5, D5],
    bass:   [A3, _, _, E3, A3, _, E3, _],
    chord:  [C4, E4, A4],
  },
  // Bar 4: F
  {
    melody: [C5, _, A4, F4, G4, A4, C5, _],
    bass:   [F3, _, _, C3, F3, _, C3, G3],
    chord:  [C4, F4, A4],
  },
  // Bar 5: C
  {
    melody: [E5, _, G5, A5, G5, _, E5, C5],
    bass:   [C3, _, _, G3, C3, _, E3, _],
    chord:  [E4, G4, C5],
  },
  // Bar 6: F
  {
    melody: [F5, _, E5, D5, C5, _, A4, _],
    bass:   [F3, _, _, C3, F3, _, A3, _],
    chord:  [C4, F4, A4],
  },
  // Bar 7: Dm7
  {
    melody: [D5, _, F5, E5, D5, _, C5, A4],
    bass:   [D3, _, _, A3, D3, _, F3, _],
    chord:  [D4, F4, A4, C5],
  },
  // Bar 8: G7 (bouncy turnaround)
  {
    melody: [B4, _, D5, G5, _, F5, D5, _],
    bass:   [G3, _, _, D3, G3, _, A3, B3],
    chord:  [D4, F4, G4, B4],
  },

  // === SECTION B (Bars 9-16): Lively "enjot" chorus lift ===
  // Bar 9: F
  {
    melody: [A5, _, G5, F5, C5, _, F5, _],
    bass:   [F3, _, _, C3, F3, _, C3, _],
    chord:  [C4, F4, A4],
  },
  // Bar 10: G
  {
    melody: [G5, _, F5, D5, B4, _, D5, G5],
    bass:   [G3, _, _, D3, G3, _, D3, _],
    chord:  [D4, G4, B4],
  },
  // Bar 11: Em7
  {
    melody: [E5, _, G5, E5, B4, _, E5, _],
    bass:   [E3, _, _, B3, E3, _, B3, _],
    chord:  [E4, G4, B4, D5],
  },
  // Bar 12: Am7
  {
    melody: [A5, _, G5, E5, C5, _, E5, G5],
    bass:   [A3, _, _, E3, A3, _, G3, _],
    chord:  [C4, E4, G4, A4],
  },
  // Bar 13: Dm7
  {
    melody: [F5, _, E5, D5, A4, _, D5, F5],
    bass:   [D3, _, _, A3, D3, _, A3, _],
    chord:  [D4, F4, A4, C5],
  },
  // Bar 14: G7
  {
    melody: [E5, _, D5, B4, G4, _, B4, D5],
    bass:   [G3, _, _, D3, G3, _, D3, _],
    chord:  [D4, F4, G4, B4],
  },
  // Bar 15: C
  {
    melody: [C5, _, E5, G5, C5, _, E5, _],
    bass:   [C3, _, _, G3, C3, _, E3, G3],
    chord:  [E4, G4, C5],
  },
  // Bar 16: G7 -> playful pickup back to Bar 1
  {
    melody: [D5, _, G5, _, F5, E5, D5, _],
    bass:   [G3, _, _, D3, G3, _, A3, B3],
    chord:  [D4, F4, G4, B4],
  },
];

const BPM = 122;
const EIGHTH_DUR = 60 / BPM / 2; // ~0.2459s per 8th note
const SWING_OFFSET = EIGHTH_DUR * 0.12; // subtle bouncy swing on offbeats
const STEPS_PER_BAR = 8;
const TOTAL_STEPS = SONG_BARS.length * STEPS_PER_BAR;
const MASTER_VOLUME = 0.24;

class BgmEngine {
  private isPlaying = false;
  private shouldPlay = false;
  private isTabHidden = false;
  private currentStep = 0;
  private nextNoteTime = 0;
  private timerId: number | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private ensureNodes(ctx: AudioContext): GainNode {
    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      const length = Math.floor(ctx.sampleRate * 0.1);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.masterGain;
  }

  /**
   * Playful woody marimba / kalimba note
   */
  private playMarimba(ctx: AudioContext, dest: AudioNode, midi: number, time: number, accent: boolean) {
    const freq = midiToFreq(midi);
    const vol = accent ? 0.24 : 0.18;

    // Fundamental sine
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    // Subtle 2nd harmonic for woody warmth
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, time);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.0001, time);
    gain1.gain.linearRampToValueAtTime(vol, time + 0.006);
    gain1.gain.exponentialRampToValueAtTime(0.0008, time + 0.28);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.0001, time);
    gain2.gain.linearRampToValueAtTime(vol * 0.22, time + 0.004);
    gain2.gain.exponentialRampToValueAtTime(0.0008, time + 0.09);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(dest);
    gain2.connect(dest);

    osc1.start(time);
    osc1.stop(time + 0.3);
    osc2.start(time);
    osc2.stop(time + 0.11);
  }

  /**
   * Warm bouncy plucked bass
   */
  private playBass(ctx: AudioContext, dest: AudioNode, midi: number, time: number) {
    const freq = midiToFreq(midi);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, time);
    filter.frequency.exponentialRampToValueAtTime(220, time + 0.22);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.32, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.26);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.28);
  }

  /**
   * Light offbeat ukulele/kalimba chord stab (the "enjot" skank groove)
   */
  private playChordStab(ctx: AudioContext, dest: AudioNode, notes: number[], time: number) {
    notes.forEach((midi, idx) => {
      const start = time + idx * 0.011; // tiny ukulele strum stagger
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(midiToFreq(midi), start);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.075, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  /**
   * Soft punchy kick drum
   */
  private playKick(ctx: AudioContext, dest: AudioNode, time: number, soft = false) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.09);

    const gain = ctx.createGain();
    const peak = soft ? 0.22 : 0.34;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * Crisp playful woodblock / rimshot on beats 2 & 4
   */
  private playWoodblock(ctx: AudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(840, time);
    osc.frequency.exponentialRampToValueAtTime(600, time + 0.035);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  /**
   * Gentle shaker / hi-hat using filtered noise buffer
   */
  private playShaker(ctx: AudioContext, dest: AudioNode, time: number, accent: boolean) {
    if (!this.noiseBuffer) return;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(accent ? 7500 : 6200, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = ctx.createGain();
    const peak = accent ? 0.055 : 0.028;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0008, time + 0.045);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    src.start(time);
    src.stop(time + 0.05);
  }

  private scheduleStep(ctx: AudioContext, dest: AudioNode, stepIndex: number, baseTime: number) {
    const barIdx = Math.floor(stepIndex / STEPS_PER_BAR);
    const stepInBar = stepIndex % STEPS_PER_BAR;
    const bar = SONG_BARS[barIdx];

    // Apply gentle bouncy swing on odd eighth notes
    const isOffbeat = stepInBar % 2 === 1;
    const time = isOffbeat ? baseTime + SWING_OFFSET : baseTime;

    // 1. Melody (marimba)
    const melodyNote = bar.melody[stepInBar];
    if (melodyNote > 0) {
      this.playMarimba(ctx, dest, melodyNote, time, stepInBar === 0 || stepInBar === 4);
    }

    // 2. Bass (bouncy root/fifth)
    const bassNote = bar.bass[stepInBar];
    if (bassNote > 0) {
      this.playBass(ctx, dest, bassNote, time);
    }

    // 3. Offbeat ukulele chord stabs (steps 1, 3, 5, 7 -> "&" of every beat!)
    if (stepInBar === 1 || stepInBar === 3 || stepInBar === 5 || stepInBar === 7) {
      this.playChordStab(ctx, dest, bar.chord, time);
    }

    // 4. Groove percussion
    // Kick on beat 1 (0), beat 3 (4), and occasional playful syncopation on 3 (2&) in Section B
    if (stepInBar === 0 || stepInBar === 4) {
      this.playKick(ctx, dest, time, false);
    } else if (barIdx >= 8 && stepInBar === 3) {
      this.playKick(ctx, dest, time, true);
    }

    // Woodblock / rimshot on beats 2 (2) and 4 (6)
    if (stepInBar === 2 || stepInBar === 6) {
      this.playWoodblock(ctx, dest, time);
    }

    // Light shaker on every 8th note, accented on offbeats for groove
    this.playShaker(ctx, dest, time, isOffbeat);
  }

  private scheduler = () => {
    if (!this.isPlaying) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    const dest = this.ensureNodes(ctx);
    const lookahead = 0.12; // seconds

    // If tab lagged or resumed after pause, catch up cleanly without burst
    if (this.nextNoteTime < ctx.currentTime - 0.15) {
      this.nextNoteTime = ctx.currentTime + 0.05;
    }

    while (this.nextNoteTime < ctx.currentTime + lookahead) {
      this.scheduleStep(ctx, dest, this.currentStep, this.nextNoteTime);
      this.nextNoteTime += EIGHTH_DUR;
      this.currentStep = (this.currentStep + 1) % TOTAL_STEPS;
    }
  };

  private startInternal() {
    if (this.isPlaying || !this.shouldPlay || this.isTabHidden) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const dest = this.ensureNodes(ctx);

    // If AudioContext is still suspended (awaiting user gesture), try resume and wait for unlock()
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (this.shouldPlay && !this.isTabHidden && !this.isPlaying && ctx.state === 'running') {
          this.startInternal();
        }
      }).catch(() => {
        // Autoplay blocked until first user interaction; unlock() will kick it off.
      });
      return;
    }

    this.isPlaying = true;
    this.nextNoteTime = ctx.currentTime + 0.05;

    // Smooth fade-in
    dest.gain.cancelScheduledValues(ctx.currentTime);
    dest.gain.setValueAtTime(Math.max(dest.gain.value, 0.0001), ctx.currentTime);
    dest.gain.linearRampToValueAtTime(MASTER_VOLUME, ctx.currentTime + 0.25);

    this.timerId = window.setInterval(this.scheduler, 25);
  }

  private stopInternal() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isPlaying = false;

    const ctx = getAudioContext();
    if (ctx && this.masterGain && this.masterGain.context === ctx) {
      this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
      this.masterGain.gain.setValueAtTime(Math.max(this.masterGain.gain.value, 0.0001), ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    }
  }

  public setEnabled(enabled: boolean) {
    this.shouldPlay = enabled;
    if (enabled) {
      this.startInternal();
    } else {
      this.stopInternal();
    }
  }

  /**
   * Called on first user gesture (click/tap/keydown) to satisfy browser autoplay policy
   */
  public unlock() {
    if (!this.shouldPlay || this.isTabHidden) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (this.shouldPlay && !this.isTabHidden && !this.isPlaying) {
          this.startInternal();
        }
      }).catch(() => {});
    } else if (!this.isPlaying) {
      this.startInternal();
    }
  }

  public setTabHidden(hidden: boolean) {
    this.isTabHidden = hidden;
    if (hidden) {
      this.stopInternal();
    } else if (this.shouldPlay) {
      this.startInternal();
    }
  }
}

export const BgmPlayer = new BgmEngine();
