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
      // Red/Purple Onion (matching reference image)
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
          <ellipse cx="50" cy="85" rx="28" ry="6" fill="#000000" fillOpacity="0.2" />
          {/* Onion Body Bulb */}
          <path
            d="M50 18C30 35 24 55 24 66C24 80 36 86 50 86C64 86 76 80 76 66C76 55 70 35 50 18Z"
            fill="#AD1457"
            stroke="#212121"
            strokeWidth="4"
          />
          {/* Curved Onion Striations */}
          <path
            d="M50 20C40 38 35 52 35 68C35 78 42 84 50 85"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          <path
            d="M50 20C60 38 65 52 65 68C65 78 58 84 50 85"
            stroke="#212121"
            strokeWidth="3"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
          {/* Root tip & Top Sprout */}
          <path d="M48 86L50 92L52 86" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M50 18C48 10 42 6 38 4M50 18C52 10 56 6 60 4"
            stroke="#43A047"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'kubis':
      // Purple Cabbage (matching reference image)
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
          <ellipse cx="50" cy="84" rx="30" ry="6" fill="#000000" fillOpacity="0.2" />
          {/* Cabbage Outer Ball */}
          <circle cx="50" cy="52" r="32" fill="#6A1B9A" stroke="#212121" strokeWidth="4" />
          {/* Overlapping Leaf Layers */}
          <path
            d="M24 45C30 32 45 30 55 36C46 44 40 56 42 70C30 68 24 58 24 45Z"
            fill="#7B1FA2"
            stroke="#212121"
            strokeWidth="3.5"
          />
          <path
            d="M76 45C70 32 55 30 45 36C54 44 60 56 58 70C70 68 76 58 76 45Z"
            fill="#8E24AA"
            stroke="#212121"
            strokeWidth="3.5"
          />
          {/* Light Veins */}
          <path
            d="M48 40C44 50 44 64 48 76"
            stroke="#E1BEE7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M45 52C38 54 34 52 30 50M46 64C40 66 36 65 32 62"
            stroke="#E1BEE7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'wortel':
      // Carrot with lush green foliage
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
          <ellipse cx="50" cy="88" rx="20" ry="5" fill="#000000" fillOpacity="0.2" />
          {/* Carrot Body */}
          <path
            d="M34 32C34 26 66 26 66 32L53 84C52 87 48 87 47 84L34 32Z"
            fill="#FB8C00"
            stroke="#212121"
            strokeWidth="4"
          />
          {/* Carrot Ridges */}
          <line x1="38" y1="42" x2="48" y2="42" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="56" x2="58" y2="56" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <line x1="42" y1="70" x2="50" y2="70" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          {/* Green Carrot Leafy Tops */}
          <path
            d="M46 26C42 16 32 10 26 8C34 16 42 22 46 26Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3"
          />
          <path
            d="M50 26C50 12 52 8 54 4C56 12 54 20 52 26Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3"
          />
          <path
            d="M54 26C58 16 68 10 74 8C66 16 58 22 54 26Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="3"
          />
        </svg>
      );

    case 'paprika':
      // Yellow Bell Pepper
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
          {/* Pepper 3 Lobes */}
          <path
            d="M26 40C26 30 40 30 40 35C40 30 60 30 60 35C60 30 74 30 74 40C74 58 72 80 64 82C58 84 54 78 50 78C46 78 42 84 36 82C28 80 26 58 26 40Z"
            fill="#FDD835"
            stroke="#212121"
            strokeWidth="4"
          />
          {/* Lobe dividing lines */}
          <path d="M42 36C40 50 40 68 44 76" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          <path d="M58 36C60 50 60 68 56 76" stroke="#212121" strokeWidth="3" strokeLinecap="round" />
          {/* Green Stem */}
          <path
            d="M48 30C46 18 52 14 56 12"
            stroke="#43A047"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'selada':
      // Crisp Green Lettuce
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
          {/* Lettuce Leaves cluster */}
          <path
            d="M32 75C22 65 20 45 28 35C38 25 48 34 50 40C52 34 62 25 72 35C80 45 78 65 68 75C60 84 40 84 32 75Z"
            fill="#43A047"
            stroke="#212121"
            strokeWidth="4"
          />
          <path
            d="M36 50C42 42 58 42 64 50C62 65 58 74 50 78C42 74 38 65 36 50Z"
            fill="#66BB6A"
            stroke="#212121"
            strokeWidth="3.5"
          />
          {/* Leaf Veins */}
          <path
            d="M50 78V54M50 64L42 58M50 60L58 54"
            stroke="#C8E6C9"
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
