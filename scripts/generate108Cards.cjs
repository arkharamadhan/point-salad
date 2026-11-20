const fs = require('fs');
const path = require('path');

const RESOURCES = [
  { id: 'wortel', name: { id: 'Wortel', en: 'Carrot' }, icon: { shape: 'circle', color: '#E69F00' } },
  { id: 'selada', name: { id: 'Selada', en: 'Lettuce' }, icon: { shape: 'star', color: '#009E73' } },
  { id: 'bawang', name: { id: 'Bawang', en: 'Onion' }, icon: { shape: 'diamond', color: '#CC79A7' } },
  { id: 'paprika', name: { id: 'Paprika', en: 'Pepper' }, icon: { shape: 'square', color: '#F0E442' } },
  { id: 'tomat', name: { id: 'Tomat', en: 'Tomato' }, icon: { shape: 'triangle', color: '#D55E00' } },
  { id: 'kubis', name: { id: 'Kubis', en: 'Cabbage' }, icon: { shape: 'hexagon', color: '#0072B2' } }
];

const RES_NAMES = {
  wortel: { id: 'Wortel', en: 'Carrot' },
  selada: { id: 'Selada', en: 'Lettuce' },
  bawang: { id: 'Bawang', en: 'Onion' },
  paprika: { id: 'Paprika', en: 'Pepper' },
  tomat: { id: 'Tomat', en: 'Tomato' },
  kubis: { id: 'Kubis', en: 'Cabbage' }
};

const scoringConditions = [];

function padId(num) {
  return num < 100 ? 'S' + String(num).padStart(2, '0') : 'S' + num;
}

function padCardId(num) {
  return num < 100 ? 'C' + String(num).padStart(2, '0') : 'C' + num;
}

// -------------------------------------------------------------
// S01 - S06: One high positive (+3), one negative (-1) (Preserves original S01-S06!)
// -------------------------------------------------------------
const comboPairsHigh = [
  ['wortel', 'selada'],
  ['paprika', 'kubis'],
  ['tomat', 'bawang'],
  ['bawang', 'wortel'],
  ['kubis', 'tomat'],
  ['selada', 'paprika']
];
for (const [rPos, rNeg] of comboPairsHigh) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perItem',
    params: {
      items: [
        { resource: rPos, points: 3 },
        { resource: rNeg, points: -1 }
      ]
    },
    text: {
      id: `+3 poin per ${RES_NAMES[rPos].id}, -1 poin per ${RES_NAMES[rNeg].id}.`,
      en: `+3 points per ${RES_NAMES[rPos].en}, -1 point per ${RES_NAMES[rNeg].en}.`
    }
  });
}

// -------------------------------------------------------------
// S07 - S12: Recipe Pairs (Preserves original S07-S09!)
// -------------------------------------------------------------
const recipePairs = [
  { set: ['wortel', 'paprika'], points: 4 },
  { set: ['tomat', 'bawang'], points: 4 },
  { set: ['kubis', 'selada'], points: 4 },
  { set: ['wortel', 'kubis'], points: 5 },
  { set: ['selada', 'bawang'], points: 5 },
  { set: ['paprika', 'tomat'], points: 5 }
];
for (const rp of recipePairs) {
  const [r1, r2] = rp.set;
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perSet',
    params: {
      set: rp.set,
      points: rp.points
    },
    text: {
      id: `+${rp.points} poin per set (${RES_NAMES[r1].id} + ${RES_NAMES[r2].id}).`,
      en: `+${rp.points} points per set (${RES_NAMES[r1].en} + ${RES_NAMES[r2].en}).`
    }
  });
}

// -------------------------------------------------------------
// S13 - S20: Recipe Trios (Preserves original S10!)
// -------------------------------------------------------------
const recipeTrios = [
  { set: ['wortel', 'tomat', 'selada'], points: 7 },
  { set: ['wortel', 'paprika', 'bawang'], points: 8 },
  { set: ['tomat', 'selada', 'kubis'], points: 8 },
  { set: ['wortel', 'tomat', 'bawang'], points: 8 },
  { set: ['paprika', 'selada', 'kubis'], points: 8 },
  { set: ['wortel', 'selada', 'kubis'], points: 8 },
  { set: ['tomat', 'paprika', 'bawang'], points: 8 },
  { set: ['wortel', 'paprika', 'tomat'], points: 8 }
];
for (const rt of recipeTrios) {
  const [r1, r2, r3] = rt.set;
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perSet',
    params: {
      set: rt.set,
      points: rt.points
    },
    text: {
      id: `+${rt.points} poin per paket (1 ${RES_NAMES[r1].id} + 1 ${RES_NAMES[r2].id} + 1 ${RES_NAMES[r3].id}).`,
      en: `+${rt.points} points per pack (1 ${RES_NAMES[r1].en} + 1 ${RES_NAMES[r2].en} + 1 ${RES_NAMES[r3].en}).`
    }
  });
}

// -------------------------------------------------------------
// S21 - S22: Complete Sets of Distinct Veggies
// -------------------------------------------------------------
scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'perDistinctSet',
  params: {
    size: 6,
    points: 12
  },
  text: {
    id: '+12 poin jika punya lengkap semua 6 jenis sayur berbeda.',
    en: '+12 points per complete set of all 6 distinct veggies.'
  }
});

scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'perDistinctSet',
  params: {
    size: 5,
    points: 10
  },
  text: {
    id: '+10 poin per set 5 jenis sayur berbeda.',
    en: '+10 points per set of 5 distinct veggies.'
  }
});

// -------------------------------------------------------------
// S23 - S28: Single Veggie Positive (+2)
// -------------------------------------------------------------
const resList = ['wortel', 'selada', 'bawang', 'paprika', 'tomat', 'kubis'];
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perItem',
    params: {
      items: [{ resource: r, points: 2 }]
    },
    text: {
      id: `+2 poin per ${RES_NAMES[r].id}.`,
      en: `+2 points per ${RES_NAMES[r].en}.`
    }
  });
}

// -------------------------------------------------------------
// S29 - S43: Two Positive (+1 each) -> 15 pairs
// -------------------------------------------------------------
for (let i = 0; i < resList.length; i++) {
  for (let j = i + 1; j < resList.length; j++) {
    const r1 = resList[i];
    const r2 = resList[j];
    scoringConditions.push({
      id: padId(scoringConditions.length + 1),
      type: 'perItem',
      params: {
        items: [
          { resource: r1, points: 1 },
          { resource: r2, points: 1 }
        ]
      },
      text: {
        id: `+1 poin per ${RES_NAMES[r1].id}, +1 poin per ${RES_NAMES[r2].id}.`,
        en: `+1 point per ${RES_NAMES[r1].en}, +1 point per ${RES_NAMES[r2].en}.`
      }
    });
  }
}

// -------------------------------------------------------------
// S44 - S58: Two Positive (+2, +1), One Negative (-2) -> 15 conditions
// -------------------------------------------------------------
const comboTriple = [
  ['paprika', 'kubis', 'tomat'],
  ['tomat', 'wortel', 'selada'],
  ['selada', 'bawang', 'paprika'],
  ['bawang', 'tomat', 'kubis'],
  ['kubis', 'paprika', 'wortel'],
  ['wortel', 'selada', 'bawang'],
  ['paprika', 'wortel', 'kubis'],
  ['tomat', 'bawang', 'paprika'],
  ['selada', 'kubis', 'wortel'],
  ['bawang', 'selada', 'tomat'],
  ['kubis', 'tomat', 'bawang'],
  ['wortel', 'kubis', 'selada'],
  ['paprika', 'selada', 'tomat'],
  ['tomat', 'paprika', 'bawang'],
  ['kubis', 'selada', 'paprika']
];

for (const [r1, r2, rNeg] of comboTriple) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perItem',
    params: {
      items: [
        { resource: r1, points: 2 },
        { resource: r2, points: 1 },
        { resource: rNeg, points: -2 }
      ]
    },
    text: {
      id: `+2 poin per ${RES_NAMES[r1].id}, +1 poin per ${RES_NAMES[r2].id}, -2 poin per ${RES_NAMES[rNeg].id}.`,
      en: `+2 points per ${RES_NAMES[r1].en}, +1 point per ${RES_NAMES[r2].en}, -2 points per ${RES_NAMES[rNeg].en}.`
    }
  });
}

// -------------------------------------------------------------
// S59 - S64: Same-Veggie Pair (+5 per 2)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perSet',
    params: {
      set: [r, r],
      points: 5
    },
    text: {
      id: `+5 poin tiap 2 ${RES_NAMES[r].id}.`,
      en: `+5 points per 2 ${RES_NAMES[r].en}.`
    }
  });
}

// -------------------------------------------------------------
// S65 - S70: Same-Veggie Trio (+8 per 3)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perSet',
    params: {
      set: [r, r, r],
      points: 8
    },
    text: {
      id: `+8 poin tiap 3 ${RES_NAMES[r].id}.`,
      en: `+8 points per 3 ${RES_NAMES[r].en}.`
    }
  });
}

// -------------------------------------------------------------
// S71 - S76: Most of Each Veggie (+10 pts)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'majority',
    params: {
      resource: r,
      mode: 'most',
      points: 10
    },
    text: {
      id: `+10 poin untuk pemilik ${RES_NAMES[r].id} terbanyak (seri bagi rata).`,
      en: `+10 points for most ${RES_NAMES[r].en} (ties split).`
    }
  });
}

// -------------------------------------------------------------
// S77 - S82: Fewest of Each Veggie (+7 pts)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'majority',
    params: {
      resource: r,
      mode: 'least',
      points: 7
    },
    text: {
      id: `+7 poin untuk pemilik ${RES_NAMES[r].id} tersedikit (seri bagi rata).`,
      en: `+7 points for fewest ${RES_NAMES[r].en} (ties split).`
    }
  });
}

// -------------------------------------------------------------
// S83 - S84: Most & Fewest Total Veggies
// -------------------------------------------------------------
scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'majority',
  params: {
    resource: 'all',
    mode: 'most',
    points: 10
  },
  text: {
    id: '+10 poin untuk total sayur terbanyak (seri bagi rata).',
    en: '+10 points for most total veggies (ties split).'
  }
});

scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'majority',
  params: {
    resource: 'all',
    mode: 'least',
    points: 7
  },
  text: {
    id: '+7 poin untuk total sayur tersedikit (seri bagi rata).',
    en: '+7 points for fewest total veggies (ties split).'
  }
});

// -------------------------------------------------------------
// S85 - S90: Parity Even (+7 if even, 0 count scores 0)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'parity',
    params: {
      resource: r,
      evenPoints: 7,
      oddPoints: 0
    },
    text: {
      id: `+7 poin jika jumlah ${RES_NAMES[r].id} genap (angka 0 bernilai 0).`,
      en: `+7 points if ${RES_NAMES[r].en} count is even (0 scores 0).`
    }
  });
}

// -------------------------------------------------------------
// S91 - S96: Parity Odd (+3 if odd)
// -------------------------------------------------------------
for (const r of resList) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'parity',
    params: {
      resource: r,
      evenPoints: 0,
      oddPoints: 3
    },
    text: {
      id: `+3 poin jika jumlah ${RES_NAMES[r].id} ganjil.`,
      en: `+3 points if ${RES_NAMES[r].en} count is odd.`
    }
  });
}

// -------------------------------------------------------------
// S97 - S108: Variety / Jenis Sayur (12 conditions)
// -------------------------------------------------------------
// S97-S98: Per type >= 2 (+5 each)
for (let i = 0; i < 2; i++) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perTypeAtLeast',
    params: {
      threshold: 2,
      points: 5
    },
    text: {
      id: '+5 poin untuk setiap jenis sayur yang kamu punya minimal 2.',
      en: '+5 points for each veggie type you have at least 2 of.'
    }
  });
}

// S99-S100: Per type >= 3 (+7 each)
for (let i = 0; i < 2; i++) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perTypeAtLeast',
    params: {
      threshold: 3,
      points: 7
    },
    text: {
      id: '+7 poin untuk setiap jenis sayur yang kamu punya minimal 3.',
      en: '+7 points for each veggie type you have at least 3 of.'
    }
  });
}

// S101-S102: Per missing type (+5 each)
for (let i = 0; i < 2; i++) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perMissingType',
    params: {
      points: 5
    },
    text: {
      id: '+5 poin untuk setiap jenis sayur yang tidak kamu punya (0).',
      en: '+5 points for each veggie type you have none of (0).'
    }
  });
}

// S103-S104: Per missing type (+3 each)
for (let i = 0; i < 2; i++) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perMissingType',
    params: {
      points: 3
    },
    text: {
      id: '+3 poin untuk setiap jenis sayur yang tidak kamu punya (0).',
      en: '+3 points for each veggie type you have none of (0).'
    }
  });
}

// S105-S106: Per pair any (+3 each)
for (let i = 0; i < 2; i++) {
  scoringConditions.push({
    id: padId(scoringConditions.length + 1),
    type: 'perPairAny',
    params: {
      points: 3
    },
    text: {
      id: '+3 poin per pasang sayur sejenis apa saja.',
      en: '+3 points per pair of any matching veggie.'
    }
  });
}

// S107: Max stack (+2 per card)
scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'maxStack',
  params: {
    pointsPerCard: 2
  },
  text: {
    id: '+2 poin per kartu pada tumpukan sayur terbanyakmu.',
    en: '+2 points per card in your largest veggie stack.'
  }
});

// S108: Balanced salad (diff <= 2 -> 12 pts)
scoringConditions.push({
  id: padId(scoringConditions.length + 1),
  type: 'balanced',
  params: {
    maxDifference: 2,
    points: 12
  },
  text: {
    id: '+12 poin jika selisih jenis terbanyak dan tersedikit <= 2 (semua 6 jenis).',
    en: '+12 points if difference between max and min veggie <= 2.'
  }
});

if (scoringConditions.length !== 108) {
  throw new Error(`Expected 108 scoring conditions, got ${scoringConditions.length}`);
}

// -------------------------------------------------------------
// Assign Veggie Sides to the 108 Cards (C01 - C99, C100 - C108)
// Exactly 18 of each of the 6 vegetables:
// wortel, selada, bawang, paprika, tomat, kubis
// -------------------------------------------------------------
const cards = [];
for (let i = 0; i < 108; i++) {
  const cardId = padCardId(i + 1);
  const scoringId = scoringConditions[i].id;
  // Distribute veggies round-robin
  const resource = resList[i % 6];
  cards.push({
    id: cardId,
    resource: resource,
    scoring: scoringId
  });
}

// Validation
const veggieCounts = {};
for (const c of cards) {
  veggieCounts[c.resource] = (veggieCounts[c.resource] || 0) + 1;
}
console.log('Veggie counts:', veggieCounts);
for (const r of resList) {
  if (veggieCounts[r] !== 18) {
    throw new Error(`Resource ${r} does not have 18 cards! Count: ${veggieCounts[r]}`);
  }
}

const fullData = {
  meta: {
    workingTitle: 'Point Salad',
    version: '2.0.0',
    note: '108 kartu bolak-balik resmi Point Salad dengan 6 jenis sayuran (18 kartu per sayur) dan 108 kondisi skor unik.',
    totalCards: 108,
    playerCounts: {
      '2': { removePerResource: 12, deckSize: 36, pileSize: 12 },
      '3': { removePerResource: 9, deckSize: 54, pileSize: 18 },
      '4': { removePerResource: 6, deckSize: 72, pileSize: 24 },
      '5': { removePerResource: 3, deckSize: 90, pileSize: 30 },
      '6': { removePerResource: 0, deckSize: 108, pileSize: 36 }
    }
  },
  scoringTypes: {
    perItem: 'Jumlahkan points x jumlah kartu untuk tiap entri items (points boleh negatif).',
    perSet: 'points x jumlah set lengkap = min(floor(count_i / required_i)).',
    perDistinctSet: 'points x m, m = bilangan bulat terbesar yang memenuhi sum(min(count_i, m)) >= size*m (set berisi size jenis berbeda).',
    parity: 'evenPoints jika jumlah resource genap (angka 0 bernilai 0 / tidak genap), selain itu oddPoints.',
    majority: 'mode most/least dibandingkan antar semua pemain (sayur tertentu atau total seluruh sayur). Seri membagi points rata, dibulatkan ke bawah.',
    perTypeAtLeast: 'points untuk setiap jenis sayur dengan count >= threshold.',
    perMissingType: 'points untuk setiap jenis sayur dengan count == 0.',
    perPairAny: 'points x sum(floor(count/2)) di seluruh jenis sayur.',
    maxStack: 'pointsPerCard x count terbesar di antara 6 jenis sayur.',
    balanced: 'points jika (count terbesar - count terkecil) <= maxDifference, selain itu 0. Hitung semua 6 jenis, termasuk yang 0.'
  },
  resources: RESOURCES,
  scoringConditions: scoringConditions,
  cards: cards
};

const jsonStr = JSON.stringify(fullData, null, 2);
fs.writeFileSync(path.join(__dirname, '../cards.json'), jsonStr);
fs.writeFileSync(path.join(__dirname, '../src/data/cards.json'), jsonStr);
console.log('Successfully written 108 cards to cards.json and src/data/cards.json');
