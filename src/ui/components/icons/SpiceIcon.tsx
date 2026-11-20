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
    color: '#E53935',
    bgColor: '#FFEBEE',
    borderColor: '#C62828',
    badgeBg: '#EF5350',
    shape: 'circle',
  },
  wortel: {
    nameId: 'Wortel',
    nameEn: 'Carrot',
    color: '#FB8C00',
    bgColor: '#FFF3E0',
    borderColor: '#EF6C00',
    badgeBg: '#FFA726',
    shape: 'triangle',
  },
  paprika: {
    nameId: 'Paprika',
    nameEn: 'Pepper',
    color: '#FDD835',
    bgColor: '#FFFDE7',
    borderColor: '#FBC02D',
    badgeBg: '#FFEE58',
    shape: 'square',
  },
  selada: {
    nameId: 'Selada',
    nameEn: 'Lettuce',
    color: '#43A047',
    bgColor: '#E8F5E9',
    borderColor: '#2E7D32',
    badgeBg: '#66BB6A',
    shape: 'star',
  },
  bawang: {
    nameId: 'Bawang',
    nameEn: 'Onion',
    color: '#AD1457',
    bgColor: '#FCE4EC',
    borderColor: '#880E4F',
    badgeBg: '#EC407A',
    shape: 'diamond',
  },
  kubis: {
    nameId: 'Kubis',
    nameEn: 'Cabbage',
    color: '#6A1B9A',
    bgColor: '#F3E5F5',
    borderColor: '#4A148C',
    badgeBg: '#AB47BC',
    shape: 'hexagon',
  },
};

export const SPICE_INFO = VEGGIE_INFO;

export const VeggieIcon: React.FC<VeggieIconProps> = ({ resource, className = '', size = 32 }) => {
  switch (resource) {
    case 'tomat':
      // Plump Cartoon Tomato with green calyx and specular shine (matching reference image)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Drop shadow */}
          <ellipse cx="50" cy="85" rx="32" ry="7" fill="#000000" fillOpacity="0.2" />
          {/* Tomato Body */}
          <ellipse cx="50" cy="54" rx="35" ry="32" fill="#E53935" stroke="#212121" strokeWidth="4" />
          {/* Specular curved highlight */}
          <path
            d="M26 44C26 34 35 28 44 26"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Green Calyx / Leaf Top */}
          <path
            d="M50 32C46 22 36 20 30 22C36 28 42 32 46 34M50 32C50 18 52 14 56 12C54 20 52 26 52 32M50 32C56 22 66 22 70 24C64 28 58 32 54 34"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'bawang':
      // Red/Purple Onion (matching reference cartoon style: tilted bulb, green sprout, layer stripes)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="88" rx="28" ry="6" fill="#000000" fillOpacity="0.2" />
          
          {/* Green Top Sprouts (drawn behind stem tip) */}
          <path
            d="M50 20C48 9 38 6 32 5C40 12 45 16 48 22"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M50 20C53 10 62 7 68 5C60 12 55 16 52 22"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Onion Body Bulb (tilted teardrop) */}
          <path
            d="M50 18C30 34 22 54 22 68C22 82 34 88 50 88C66 88 78 82 78 68C78 54 70 34 50 18Z"
            fill="#AD1457"
            stroke="#212121"
            strokeWidth="4"
          />

          {/* Curved Onion Peel Striations & Highlights */}
          <path
            d="M50 20C38 38 32 54 32 70C32 80 40 86 50 87"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
          <path
            d="M50 20C43 40 40 56 40 72C40 81 44 86 50 87"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          <path
            d="M50 20C60 38 66 54 66 70C66 80 58 86 50 87"
            stroke="#212121"
            strokeWidth="3"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />

          {/* Root hairs at base */}
          <path d="M46 88L47 94M50 88L50 95M54 88L53 94" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'kubis':
      // Purple Cabbage (matching reference: round violet cabbage with concentric ruffled leaf layers & lilac veins)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="86" rx="30" ry="6" fill="#000000" fillOpacity="0.2" />

          {/* Outer Cabbage Ball */}
          <circle cx="50" cy="52" r="32" fill="#6A1B9A" stroke="#212121" strokeWidth="4" />

          {/* Left Overlapping Leaf Layer */}
          <path
            d="M24 44C28 30 46 28 58 35C48 44 42 58 44 74C30 72 24 60 24 44Z"
            fill="#7B1FA2"
            stroke="#212121"
            strokeWidth="3.5"
          />

          {/* Right Overlapping Leaf Layer */}
          <path
            d="M76 44C72 30 54 28 42 35C52 44 58 58 56 74C70 72 76 60 76 44Z"
            fill="#8E24AA"
            stroke="#212121"
            strokeWidth="3.5"
          />

          {/* Center Ruffled Leaf Layer */}
          <path
            d="M38 48C44 40 56 40 62 48C64 62 58 72 50 75C42 72 36 62 38 48Z"
            fill="#9C27B0"
            stroke="#212121"
            strokeWidth="3"
          />

          {/* Delicate Lilac/Lavender Leaf Veins */}
          <path
            d="M50 48V74M50 56L43 51M50 63L44 59M50 56L57 51M50 63L56 59"
            stroke="#E1BEE7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Specular White Highlight Arc on Upper Leaf */}
          <path
            d="M32 29C42 24 58 24 68 29"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
        </svg>
      );

    case 'wortel':
      // Carrot (matching reference: DIAGONAL ~45° tilt, bright orange body, 3 ridges, bushy green leaf top at top-right)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Drop Shadow */}
          <ellipse cx="46" cy="86" rx="26" ry="6" fill="#000000" fillOpacity="0.2" />

          {/* Lush Green Foliage at Top-Right */}
          {/* Center leafy lobe */}
          <path
            d="M66 32C72 18 84 14 90 10C86 22 80 28 72 36Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Top leafy lobe */}
          <path
            d="M62 26C60 12 68 6 74 4C72 16 68 22 64 28Z"
            fill="#4CAF50"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Right leafy lobe */}
          <path
            d="M72 36C82 32 92 36 96 42C86 44 78 40 70 38Z"
            fill="#388E3C"
            stroke="#212121"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Carrot Body (Diagonal 45 degrees, tapering from top-right to bottom-left) */}
          <path
            d="M60 28C67 35 72 40 68 44L28 84C24 88 20 84 20 80L36 36C40 32 52 20 60 28Z"
            fill="#FB8C00"
            stroke="#212121"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Specular Shine Streak along Upper Ridge */}
          <path
            d="M32 64L54 36"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />

          {/* 3 Transverse Ridges */}
          <line x1="56" y1="36" x2="65" y2="44" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="50" x2="52" y2="58" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="64" x2="38" y2="72" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'paprika':
      // Yellow Bell Pepper (matching reference: 3 plump rounded lobes, green stem on top)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="86" rx="28" ry="6" fill="#000000" fillOpacity="0.2" />

          {/* Green Stem with Dark Outline */}
          <path
            d="M48 34C46 20 52 14 58 12"
            stroke="#212121"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M48 34C46 20 52 14 58 12"
            stroke="#43A047"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Pepper 3 Lobes */}
          <path
            d="M26 42C26 31 39 31 41 36C44 31 56 31 59 36C61 31 74 31 74 42C74 58 72 78 64 82C58 84 53 79 50 79C47 79 42 84 36 82C28 78 26 58 26 42Z"
            fill="#FDD835"
            stroke="#212121"
            strokeWidth="4"
          />

          {/* Lobe dividing lines */}
          <path d="M42 36C40 50 40 68 44 76" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <path d="M58 36C60 50 60 68 56 76" stroke="#212121" strokeWidth="3" strokeLinecap="round" />

          {/* Specular White Highlight on Left Lobe */}
          <path
            d="M32 44C30 52 32 62 34 68"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />

          {/* Green Calyx Leaf Base */}
          <path
            d="M44 35C47 32 53 32 56 35"
            fill="#2E7D32"
            stroke="#212121"
            strokeWidth="2.5"
          />
        </svg>
      );

    case 'selada':
      // Crisp Green Lettuce (matching reference: ruffled outer leaf petals, inner heart, veins)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="85" rx="30" ry="6" fill="#000000" fillOpacity="0.2" />

          {/* Lettuce Outer Cluster */}
          <path
            d="M30 74C20 62 18 42 26 30C34 18 44 26 50 32C56 26 66 18 74 30C82 42 80 62 70 74C60 84 40 84 30 74Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="4"
          />

          {/* Inner Folded Leaf Heart */}
          <path
            d="M34 50C40 40 60 40 66 50C64 68 58 76 50 78C42 76 36 68 34 50Z"
            fill="#66BB6A"
            stroke="#212121"
            strokeWidth="3"
          />

          {/* Leaf Veins */}
          <path
            d="M50 76V48M50 56L42 50M50 64L40 58M50 56L58 50M50 64L60 58"
            stroke="#C8E6C9"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Scalloped Ruffled Top Highlights */}
          <path
            d="M28 34C32 26 38 28 42 34M58 34C62 28 68 26 72 34"
            stroke="#A5D6A7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return null;
  }
};

export const SpiceIcon = VeggieIcon;
