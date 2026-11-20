import React from 'react';
import { ResourceId } from '../../../engine/types';

interface VeggieIconProps {
  resource: ResourceId;
  className?: string;
  size?: number;
}

export const VEGGIE_INFO: Record<
  ResourceId,
  {
    nameId: string;
    nameEn: string;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeBg: string;
    shape: 'circle' | 'triangle' | 'square' | 'diamond' | 'hexagon' | 'star';
  }
> = {
  tomat: {
    nameId: 'Tomat',
    nameEn: 'Tomato',
    color: '#D8342E',
    bgColor: '#FFEBEE',
    borderColor: '#B71C1C',
    badgeBg: '#E53935',
    shape: 'circle',
  },
  wortel: {
    nameId: 'Wortel',
    nameEn: 'Carrot',
    color: '#F17816',
    bgColor: '#FFF3E0',
    borderColor: '#D84315',
    badgeBg: '#FB8C00',
    shape: 'triangle',
  },
  paprika: {
    nameId: 'Paprika',
    nameEn: 'Pepper',
    color: '#F2C11C',
    bgColor: '#FFFDE7',
    borderColor: '#D49B0E',
    badgeBg: '#FDD835',
    shape: 'square',
  },
  selada: {
    nameId: 'Selada',
    nameEn: 'Lettuce',
    color: '#3D9942',
    bgColor: '#E8F5E9',
    borderColor: '#256D29',
    badgeBg: '#4CAF50',
    shape: 'star',
  },
  bawang: {
    nameId: 'Bawang',
    nameEn: 'Onion',
    color: '#C72C72',
    bgColor: '#FCE4EC',
    borderColor: '#8E164E',
    badgeBg: '#E91E63',
    shape: 'diamond',
  },
  kubis: {
    nameId: 'Kubis',
    nameEn: 'Cabbage',
    color: '#7B2B9E',
    bgColor: '#F3E5F5',
    borderColor: '#52156E',
    badgeBg: '#9C27B0',
    shape: 'hexagon',
  },
};

export const SPICE_INFO = VEGGIE_INFO;

const OUTLINE = '#3B2F2F';

export const VeggieIcon: React.FC<VeggieIconProps> = ({ resource, className = '', size = 32 }) => {
  switch (resource) {
    case 'tomat':
      // Point Salad Reference Tomato: plump tilted red tomato, green 4-leaf calyx & stem at bottom-left, dark red shadow arc, crisp highlight
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main plump tilted tomato body */}
          <ellipse
            cx="54"
            cy="46"
            rx="34"
            ry="32"
            transform="rotate(-22 54 46)"
            fill="#DF322B"
            stroke={OUTLINE}
            strokeWidth="4.2"
          />
          {/* Subtle darker bottom-right crescent shade */}
          <path
            d="M82 36C86 52 77 69 60 75C48 79 37 77 29 71C40 74 52 72 63 65C74 58 80 47 82 36Z"
            fill="#B7201B"
            fillOpacity="0.65"
          />
          {/* Upper-left soft highlight arc */}
          <path
            d="M34 30C41 22 53 19 63 22"
            stroke="#FF8A80"
            strokeWidth="4"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <circle cx="29" cy="36" r="2.3" fill="#FF8A80" fillOpacity="0.85" />

          {/* Green 4-pointed star calyx + short curved stem at bottom-left (plek ketiplek foto) */}
          <path
            d="M32 61C26 57 18 57 14 60C18 65 24 67 28 68C21 71 17 77 18 82C25 81 31 76 34 71C36 77 41 83 47 85C48 78 44 71 39 67C44 65 49 62 50 58C44 58 37 60 32 61Z"
            fill="#43A047"
            stroke={OUTLINE}
            strokeWidth="3.6"
            strokeLinejoin="round"
          />
          {/* Stem */}
          <path
            d="M27 69C22 73 16 76 12 75"
            stroke="#2E7D32"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M27 69C22 73 16 76 12 75"
            stroke={OUTLINE}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'paprika':
      // Point Salad Reference Pepper: tilted diagonal yellow bell pepper with 3 chunky lobes, dark golden shading & green 3-leaf crown at top-right
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Green stem & 3-leaf calyx at top-right */}
          <path
            d="M62 24C67 16 76 13 83 16C79 22 76 26 73 29C79 27 86 28 90 34C83 38 75 38 69 36L60 28Z"
            fill="#4CAF50"
            stroke={OUTLINE}
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          <path
            d="M74 26L84 18"
            stroke={OUTLINE}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Top-left lobe */}
          <path
            d="M52 24C44 19 32 23 23 34C14 45 11 58 17 66C21 71 28 70 35 66L60 36C61 30 57 26 52 24Z"
            fill="#F4C724"
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Bottom-right lobe (darker shade) */}
          <path
            d="M73 39C79 45 77 57 68 68C59 79 45 86 35 82C29 79 28 72 32 65L60 36C65 34 70 36 73 39Z"
            fill="#DDA716"
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Center plump main lobe */}
          <path
            d="M65 32C58 26 44 30 33 43C22 56 18 70 26 77C34 83 48 78 60 65C71 52 72 38 65 32Z"
            fill="#F7CF2E"
            stroke={OUTLINE}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Soft shadow side on center lobe */}
          <path
            d="M65 36C68 44 63 55 55 64C47 73 37 77 30 76C38 74 47 68 54 60C61 52 65 43 65 36Z"
            fill="#DC9E12"
            fillOpacity="0.6"
          />
          {/* Crisp bright yellow/white curved highlight */}
          <path
            d="M46 37C39 42 32 50 29 58"
            stroke="#FFF7B2"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M27 37C23 42 20 48 19 53"
            stroke="#FFF7B2"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'bawang':
      // Point Salad Reference Onion: tilted round magenta/purple onion, pointed top-right stem tip, root tuft at bottom-left, pale-pink curved ribs
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Tiny root tuft at bottom-left */}
          <path
            d="M26 74L16 79M29 77L21 85M33 79L29 88"
            stroke={OUTLINE}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          {/* Main onion bulb with pointed top-right neck */}
          <path
            d="M77 21C74 28 73 33 75 39C82 51 79 67 66 76C53 85 35 84 26 74C16 63 17 45 29 34C40 24 55 23 64 26C69 27 72 24 75 18C77 16 79 18 77 21Z"
            fill="#C2256E"
            stroke={OUTLINE}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          {/* Deeper magenta bottom-right shadow */}
          <path
            d="M74 44C77 56 71 69 59 76C48 82 36 81 28 75C38 77 50 74 60 67C68 61 73 52 74 44Z"
            fill="#8E144E"
            fillOpacity="0.65"
          />
          {/* Curved onion skin rib lines (pale pink/white like reference photo) */}
          <path
            d="M65 30C53 31 39 39 30 52C26 58 25 65 27 71"
            stroke="#F48FB1"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M68 33C59 41 48 53 36 66"
            stroke="#F8BBD0"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="16 6"
          />
          <path
            d="M71 38C69 50 61 63 47 72C42 75 37 76 32 75"
            stroke="#9B1856"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Bright specular highlight */}
          <path
            d="M36 37C30 43 27 50 26 56"
            stroke="#FCE4EC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wortel':
      // Point Salad Reference Carrot: sleek diagonal orange carrot from bottom-left tip to top-right 3-tuft green leafy crown with crisp horizontal notches
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 3-tuft green leafy crown at top-right */}
          <path
            d="M64 33C64 23 68 14 75 12C77 18 75 24 72 29C78 23 85 20 90 24C87 30 81 33 75 35C81 35 87 38 89 43C82 46 74 44 68 39Z"
            fill="#43A047"
            stroke={OUTLINE}
            strokeWidth="3.8"
            strokeLinejoin="round"
          />
          {/* Main tapered carrot body angled bottom-left to top-right */}
          <path
            d="M58 29C64 25 71 29 73 36C75 42 70 48 64 53L28 84C21 89 14 89 13 85C12 81 15 75 21 68L52 34C54 32 56 30 58 29Z"
            fill="#F17816"
            stroke={OUTLINE}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          {/* Darker orange lower-right edge shading */}
          <path
            d="M71 39C72 44 68 49 63 53L28 83C23 87 18 88 15 86C22 83 32 75 45 63C57 52 66 44 71 39Z"
            fill="#CC5607"
            fillOpacity="0.6"
          />
          {/* Characteristic horizontal-angled white/pale-orange carrot notches */}
          <path
            d="M51 39L60 46M43 49L51 55M35 58L42 63M27 68L33 72"
            stroke="#FFD199"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          {/* Dark subtle notch accent */}
          <path
            d="M55 47L61 52M44 59L49 63"
            stroke="#B94B05"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'selada':
      // Point Salad Reference Lettuce: fluffy ruffled green lettuce head with dark outline, layered leaves & crisp inner veins
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ruffled lettuce cloud silhouette */}
          <path
            d="M36 78C24 76 15 66 17 54C13 44 19 31 30 27C35 17 50 13 61 19C73 17 85 26 84 38C90 48 86 63 75 70C70 81 55 86 44 82C41 81 38 79 36 78Z"
            fill="#3D9942"
            stroke={OUTLINE}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          {/* Deeper green outer shadow */}
          <path
            d="M82 44C86 54 81 66 71 71C65 80 51 84 40 79C52 79 64 74 72 64C78 58 81 51 82 44Z"
            fill="#256D29"
            fillOpacity="0.55"
          />
          {/* Mid-layer bright leafy folds */}
          <path
            d="M32 66C24 58 25 43 34 35C41 27 56 26 65 34C74 42 74 56 66 66C58 75 40 75 32 66Z"
            fill="#56B65A"
            stroke={OUTLINE}
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Inner light crisp lettuce heart & veins */}
          <path
            d="M42 66C37 59 38 48 45 43C52 38 61 42 62 51C63 59 56 67 48 68"
            fill="#81C784"
            stroke={OUTLINE}
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M37 72L52 52M46 60L42 49M50 56L60 54"
            stroke="#DCEDC8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Ruffled highlight arcs */}
          <path
            d="M27 36C31 30 37 27 43 26M56 24C62 24 68 27 72 32"
            stroke="#C8E6C9"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'kubis':
      // Point Salad Reference Cabbage: round layered purple cabbage with wavy folded leaves & lavender highlights
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`shrink-0 ${className}`.trim()}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer wavy cabbage leaves */}
          <path
            d="M30 78C19 72 14 58 18 45C17 34 25 22 37 20C47 14 63 16 71 25C82 30 87 43 83 56C83 68 73 79 60 81C49 86 38 83 30 78Z"
            fill="#7B2B9E"
            stroke={OUTLINE}
            strokeWidth="4.2"
            strokeLinejoin="round"
          />
          {/* Bottom-right deep purple shadow */}
          <path
            d="M81 46C83 60 75 74 60 79C49 83 37 81 29 75C41 77 55 74 65 66C74 59 79 53 81 46Z"
            fill="#4A1468"
            fillOpacity="0.6"
          />
          {/* Central round layered cabbage ball */}
          <circle
            cx="50"
            cy="50"
            r="24"
            fill="#9338B8"
            stroke={OUTLINE}
            strokeWidth="3.6"
          />
          {/* Characteristic overlapping curved cabbage leaf folds */}
          <path
            d="M34 38C44 33 57 36 65 46"
            stroke={OUTLINE}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M32 54C42 46 56 46 68 56"
            stroke={OUTLINE}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M40 66C48 59 58 58 66 64"
            stroke={OUTLINE}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Pale lavender highlights along leaf ridges */}
          <path
            d="M37 34C44 30 53 31 60 36M35 48C43 43 53 43 61 48"
            stroke="#E1BEE7"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M24 44C25 36 30 30 36 27"
            stroke="#CE93D8"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
};

export const SpiceIcon = VeggieIcon;
