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
  size?: 'normal' | 'shelf';
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

export const PointBowlRenderer: React.FC<PointBowlRendererProps> = ({ scoringId, size = 'normal' }) => {
  const condition = SCORING_CONDITIONS_MAP.get(scoringId);
  if (!condition) return null;

  const isShelf = size === 'shelf';
  const badgeSize = isShelf ? 21 : 27;
  const iconSize = isShelf ? 18 : 26;
  const smallIconSize = isShelf ? 15 : 20;

  switch (condition.type) {
    case 'perItem': {
      const params = condition.params as PerItemParams;
      const itemCount = params.items.length;
      const curBadgeSize = itemCount > 2 ? (isShelf ? 17 : 21) : badgeSize;
      const curIconSize = itemCount > 2 ? (isShelf ? 15 : 19) : iconSize;

      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 select-none">
          {params.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-center gap-1 w-full">
              <ScallopBadge value={item.points > 0 ? `${item.points}` : `${item.points}`} size={curBadgeSize} />
              <span className="text-[#7CB342] font-black text-xs sm:text-sm select-none">/</span>
              <div className="flex items-center justify-center">
                <VeggieIcon resource={item.resource} size={curIconSize} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'perSet': {
      const params = condition.params as PerSetParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={params.points} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs sm:text-sm select-none">/</span>
            <span className="text-[7.5px] sm:text-[9px] font-black uppercase text-stone-700 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200 font-fredoka">
              SET
            </span>
          </div>

          <div className="flex items-center justify-center gap-0.5 bg-stone-100/90 px-1 py-0.5 rounded-md border border-stone-200 mt-0.5 max-w-[90%]">
            {params.set.map((res, idx) => (
              <React.Fragment key={res}>
                {idx > 0 && <span className="text-[8px] font-black text-stone-400">+</span>}
                <VeggieIcon resource={res} size={smallIconSize} />
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }

    case 'perDistinctSet': {
      const params = condition.params as PerDistinctSetParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={`+${params.points}`} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs sm:text-sm select-none">/</span>
            <span className="text-[7.5px] sm:text-[9px] font-black text-stone-800 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200 font-fredoka">
              {params.size} SAYUR
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-600 mt-0.5 font-fredoka">
            Berbeda
          </span>
        </div>
      );
    }

    case 'parity': {
      const params = condition.params as ParityParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 select-none">
          <VeggieIcon resource={params.resource} size={smallIconSize} />
          <div className="flex flex-col gap-0.5 w-full max-w-[62px] text-[7.5px] font-black font-fredoka">
            <div className="flex items-center justify-between bg-stone-100/95 px-1 py-0.2 rounded border border-stone-200">
              <span className="text-stone-700">GENAP</span>
              <span className="bg-[#7CB342] text-white px-1 rounded font-black text-[8px]">
                +{params.evenPoints}
              </span>
            </div>
            <div className="flex items-center justify-between bg-stone-100/95 px-1 py-0.2 rounded border border-stone-200">
              <span className="text-stone-700">GANJIL</span>
              <span className="bg-amber-600 text-white px-1 rounded font-black text-[8px]">
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
        <div className="flex items-center justify-center gap-1 w-full py-0.5 select-none">
          <span className="text-[8px] sm:text-[9.5px] font-black uppercase text-[#0284C7] font-fredoka tracking-tighter">
            {isMost ? 'MOST' : 'FEWEST'}
          </span>
          <VeggieIcon resource={params.resource} size={iconSize} />
          <span className="text-stone-400 font-black text-[10px]">=</span>
          <ScallopBadge value={params.points} size={badgeSize} badgeBg="#7CB342" />
        </div>
      );
    }

    case 'perTypeAtLeast': {
      const params = condition.params as PerTypeAtLeastParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={`+${params.points}`} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs select-none">/</span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-800 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200">
              TIAP SAYUR
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-stone-600">
            Jml &ge; {params.threshold}
          </span>
        </div>
      );
    }

    case 'perMissingType': {
      const params = condition.params as PerMissingTypeParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={`+${params.points}`} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs select-none">/</span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-800 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200">
              KOSONG
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-stone-600">
            Jml = 0
          </span>
        </div>
      );
    }

    case 'perPairAny': {
      const params = condition.params as PerPairAnyParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={`+${params.points}`} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs select-none">/</span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-800 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200">
              PASANG
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-stone-600">
            2 Sejenis
          </span>
        </div>
      );
    }

    case 'maxStack': {
      const params = condition.params as MaxStackParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka select-none">
          <div className="flex items-center gap-1">
            <ScallopBadge value={`x${params.pointsPerCard}`} size={badgeSize} />
            <span className="text-[#7CB342] font-black text-xs select-none">/</span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-800 bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200">
              MAKS
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-stone-600">
            Terbanyak
          </span>
        </div>
      );
    }

    case 'balanced': {
      const params = condition.params as BalancedParams;
      return (
        <div className="flex flex-col items-center justify-center gap-0.5 w-full py-0.5 text-center font-fredoka select-none">
          <ScallopBadge value={`+${params.points}`} size={badgeSize} badgeBg="#FB8C00" />
          <span className="text-[7.5px] sm:text-[8.5px] font-black text-stone-800 uppercase tracking-wider bg-stone-100/95 px-1 py-0.5 rounded border border-stone-200 mt-0.5">
            SEIMBANG
          </span>
          <span className="text-[7px] sm:text-[8px] font-bold text-stone-600">
            Selisih &le; {params.maxDifference}
          </span>
        </div>
      );
    }

    default:
      return null;
  }
};
