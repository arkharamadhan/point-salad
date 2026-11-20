import React from 'react';
import { SCORING_CONDITIONS_MAP } from '../../engine/scoring';
import {
  BalancedParams,
  MajorityParams,
  MaxStackParams,
  ParityParams,
  PerDistinctSetParams,
  PerItemParams,
  PerMissingTypeParams,
  PerPairAnyParams,
  PerSetParams,
  PerTypeAtLeastParams,
} from '../../engine/types';
import { VeggieIcon } from './icons/SpiceIcon';

interface PointBowlRendererProps {
  scoringId: string;
}

// Generate an exact 20-petaled scalloped badge matching the Point Salad card design
const SCALLOP_OUTER_PATH = (() => {
  const cx = 18;
  const cy = 18;
  const r = 14;
  const petals = 20;
  let path = '';
  const step = (Math.PI * 2) / petals;
  for (let i = 0; i < petals; i++) {
    const angle = i * step;
    const nextAngle = (i + 1) * step;
    const midAngle = (angle + nextAngle) / 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const mx = cx + (r + 1.8) * Math.cos(midAngle);
    const my = cy + (r + 1.8) * Math.sin(midAngle);
    const x2 = cx + r * Math.cos(nextAngle);
    const y2 = cy + r * Math.sin(nextAngle);
    if (i === 0) {
      path += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    path += `Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  path += 'Z';
  return path;
})();

const SCALLOP_INNER_PATH = (() => {
  const cx = 18;
  const cy = 18;
  const r = 11.5;
  const petals = 20;
  let path = '';
  const step = (Math.PI * 2) / petals;
  for (let i = 0; i < petals; i++) {
    const angle = i * step;
    const nextAngle = (i + 1) * step;
    const midAngle = (angle + nextAngle) / 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const mx = cx + (r + 1.4) * Math.cos(midAngle);
    const my = cy + (r + 1.4) * Math.sin(midAngle);
    const x2 = cx + r * Math.cos(nextAngle);
    const y2 = cy + r * Math.sin(nextAngle);
    if (i === 0) {
      path += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    path += `Q ${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  path += 'Z';
  return path;
})();

export const ScallopBadge: React.FC<{
  value: string | number;
  size?: number;
  badgeBg?: string;
}> = ({ value, size = 30, badgeBg = '#7CB342' }) => {
  const strVal = String(value);
  const isSmall = strVal.length > 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="flex-shrink-0 drop-shadow-sm select-none"
    >
      {/* Outer scalloped rosette shape */}
      <path d={SCALLOP_OUTER_PATH} fill={badgeBg} stroke="#558B2F" strokeWidth="1" />
      {/* Inner scalloped white border */}
      <path
        d={SCALLOP_INNER_PATH}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeDasharray="2 1.5"
      />
      {/* Centered value with drop shadow */}
      <text
        x="18"
        y={isSmall ? '22' : '23'}
        textAnchor="middle"
        fill="#FFFFFF"
        fontWeight="900"
        fontSize={isSmall ? '10' : '13'}
        fontFamily="'Fredoka', ui-rounded, sans-serif"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))' }}
      >
        {value}
      </text>
    </svg>
  );
};

export const PointBowlRenderer: React.FC<PointBowlRendererProps> = ({ scoringId }) => {
  const condition = SCORING_CONDITIONS_MAP.get(scoringId);
  if (!condition) return null;

  switch (condition.type) {
    case 'perItem': {
      const params = condition.params as PerItemParams;
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full py-0.5">
          {params.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center gap-1.5 w-full">
              {/* Scalloped badge */}
              <ScallopBadge value={item.points > 0 ? `${item.points}` : `${item.points}`} size={28} />

              {/* Lime green slash divider matching reference */}
              <span className="text-[#7CB342] font-black text-base select-none">/</span>

              {/* Cute cartoon vegetable icon */}
              <div className="w-7 h-7 flex items-center justify-center">
                <VeggieIcon resource={item.resource} size={28} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'perSet': {
      const params = condition.params as PerSetParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={params.points} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <span className="text-[10px] font-black uppercase text-stone-700 bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300 font-fredoka">
              SET
            </span>
          </div>

          <div className="flex items-center justify-center gap-0.5 bg-stone-100/90 px-1.5 py-0.5 rounded-lg border border-stone-200 mt-0.5">
            {params.set.map((res, idx) => (
              <React.Fragment key={res}>
                {idx > 0 && <span className="text-[10px] font-black text-stone-400">+</span>}
                <VeggieIcon resource={res} size={20} />
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    case 'perDistinctSet': {
      const params = condition.params as PerDistinctSetParams;
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full py-0.5">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={`+${params.points}`} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <div className="text-center font-black text-[10px] text-stone-800 leading-tight font-fredoka">
              {params.size} SAYUR<br />BERBEDA
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-[10px] text-stone-600 font-black mt-0.5 font-fredoka">
            <span>🥗 Set Lengkap</span>
          </div>
        </div>
      );
    }

    case 'parity': {
      const params = condition.params as ParityParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5">
          <div className="flex items-center gap-1">
            <VeggieIcon resource={params.resource} size={24} />
          </div>
          <div className="flex flex-col gap-0.5 w-full px-2 text-[9px] font-black font-fredoka">
            <div className="flex items-center justify-between bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-200">
              <span className="text-stone-700">GENAP</span>
              <span className="bg-[#7CB342] text-white px-1.5 rounded font-black text-[10px]">
                +{params.evenPoints}
              </span>
            </div>
            <div className="flex items-center justify-between bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-200">
              <span className="text-stone-700">GANJIL</span>
              <span className="bg-amber-600 text-white px-1.5 rounded font-black text-[10px]">
                +{params.oddPoints}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'majority': {
      const params = condition.params as MajorityParams;
      const isMost = params.mode === 'most';
      return (
        <div className="flex items-center justify-center gap-1 w-full py-0.5">
          <span className="text-[10px] font-black uppercase text-[#0284C7] font-fredoka tracking-tighter">
            {isMost ? 'MOST' : 'FEWEST'}
          </span>
          <VeggieIcon resource={params.resource} size={24} />
          <span className="text-stone-400 font-black text-xs">=</span>
          <ScallopBadge value={params.points} size={26} badgeBg="#7CB342" />
        </div>
      );
    }

    case 'perTypeAtLeast': {
      const params = condition.params as PerTypeAtLeastParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={`+${params.points}`} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <span className="text-[9px] font-black text-stone-800 bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300">
              TIAP SAYUR
            </span>
          </div>
          <span className="text-[9px] font-bold text-stone-600 mt-0.5">
            Jumlah &ge; {params.threshold}
          </span>
        </div>
      );
    }

    case 'perMissingType': {
      const params = condition.params as PerMissingTypeParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={`+${params.points}`} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <span className="text-[9px] font-black text-stone-800 bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300">
              KOSONG
            </span>
          </div>
          <span className="text-[9px] font-bold text-stone-600 mt-0.5">
            Sayur dengan Jumlah = 0
          </span>
        </div>
      );
    }

    case 'perPairAny': {
      const params = condition.params as PerPairAnyParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={`+${params.points}`} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <span className="text-[9px] font-black text-stone-800 bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300">
              PASANG
            </span>
          </div>
          <span className="text-[9px] font-bold text-stone-600 mt-0.5">
            Tiap 2 Sayur Sejenis
          </span>
        </div>
      );
    }

    case 'maxStack': {
      const params = condition.params as MaxStackParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka">
          <div className="flex items-center gap-1.5">
            <ScallopBadge value={`x${params.pointsPerCard}`} size={28} />
            <span className="text-[#7CB342] font-black text-base select-none">/</span>
            <span className="text-[9px] font-black text-stone-800 bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300">
              KARTU
            </span>
          </div>
          <span className="text-[9px] font-bold text-stone-600 mt-0.5">
            Tumpukan Sayur Terbanyak
          </span>
        </div>
      );
    }

    case 'balanced': {
      const params = condition.params as BalancedParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka">
          <ScallopBadge value={`+${params.points}`} size={28} badgeBg="#FB8C00" />
          <span className="text-[9px] font-black text-stone-800 uppercase tracking-wider bg-stone-100/95 px-1.5 py-0.5 rounded border border-stone-300 mt-0.5">
            SEIMBANG
          </span>
          <span className="text-[8px] font-bold text-stone-600">
            Selisih Maks &le; {params.maxDifference}
          </span>
        </div>
      );
    }

    default:
      return null;
  }
};
