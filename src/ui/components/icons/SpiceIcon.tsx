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
    shape: 'triangle' | 'square' | 'circle' | 'diamond' | 'hexagon' | 'star';
  }
> = {
  wortel: {
    nameId: 'Wortel',
    nameEn: 'Carrot',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#D97706',
    shape: 'triangle',
  },
  jagung: {
    nameId: 'Jagung',
    nameEn: 'Corn',
    color: '#EAB308',
    bgColor: '#FEFCE8',
    borderColor: '#EAB308',
    shape: 'square',
  },
  tomat: {
    nameId: 'Tomat',
    nameEn: 'Tomato',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#DC2626',
    shape: 'circle',
  },
  terong: {
    nameId: 'Terong',
    nameEn: 'Eggplant',
    color: '#9333EA',
    bgColor: '#FAF5FF',
    borderColor: '#9333EA',
    shape: 'diamond',
  },
  jamur: {
    nameId: 'Jamur',
    nameEn: 'Mushroom',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#2563EB',
    shape: 'hexagon',
  },
  brokoli: {
    nameId: 'Brokoli',
    nameEn: 'Broccoli',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#059669',
    shape: 'star',
  },
};

// Backward-compatible alias
export const SPICE_INFO = VEGGIE_INFO;

export const VeggieIcon: React.FC<VeggieIconProps> = ({ resource, className = '', size = 24 }) => {
  const info = VEGGIE_INFO[resource];

  switch (resource) {
    case 'wortel':
      // Triangle shape with crisp carrot root & green foliage
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Triangle Container */}
          <path
            d="M50 8L92 84C93 86 91 89 88 89H12C9 89 7 86 8 84L50 8Z"
            fill={info.color}
          />
          <path
            d="M50 20L82 78H18L50 20Z"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          {/* Green Carrot Foliage Top */}
          <path
            d="M48 24C46 16 38 12 36 10M50 24C50 14 52 10 54 8M52 24C56 16 64 14 66 12"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Carrot Body Texture */}
          <path
            d="M50 26L36 78C35 82 45 84 50 84C55 84 65 82 64 78L50 26Z"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
          {/* Carrot Ridge Lines */}
          <line x1="42" y1="42" x2="52" y2="42" stroke={info.color} strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="54" x2="58" y2="54" stroke={info.color} strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="66" x2="53" y2="66" stroke={info.color} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'jagung':
      // Square shape with golden sweet corn cob & kernels
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="8" width="84" height="84" rx="14" fill={info.color} />
          <rect x="14" y="14" width="72" height="72" rx="10" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.4" />
          {/* Corn Cob Oval */}
          <rect x="36" y="24" width="28" height="52" rx="14" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Golden Kernels Matrix */}
          <circle cx="43" cy="34" r="3.5" fill={info.color} />
          <circle cx="57" cy="34" r="3.5" fill={info.color} />
          <circle cx="43" cy="46" r="3.5" fill={info.color} />
          <circle cx="57" cy="46" r="3.5" fill={info.color} />
          <circle cx="43" cy="58" r="3.5" fill={info.color} />
          <circle cx="57" cy="58" r="3.5" fill={info.color} />
          <circle cx="50" cy="70" r="3.5" fill={info.color} />
          {/* Green Husk Wings */}
          <path
            d="M36 68C28 62 26 50 30 40M64 68C72 62 74 50 70 40"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'tomat':
      // Circle shape with round plump tomato & star calyx
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" fill={info.color} />
          <circle cx="50" cy="50" r="38" stroke="#FFFFFF" strokeWidth="4" strokeOpacity="0.4" />
          {/* Tomato Red Fruit Inner */}
          <ellipse cx="50" cy="54" rx="28" ry="24" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Green 5-point Calyx Leaf on top */}
          <path
            d="M50 28L45 20M50 28L55 20M50 28L38 28M50 28L62 28M50 28V16"
            stroke="#10B981"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Tomato Shine Accent */}
          <ellipse cx="42" cy="46" rx="4" ry="7" fill={info.color} opacity="0.8" />
        </svg>
      );

    case 'terong':
      // Diamond shape with deep purple aubergine
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 5L95 50L50 95L5 50L50 5Z" fill={info.color} />
          <path d="M50 14L86 50L50 86L14 50L50 14Z" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.4" />
          {/* Eggplant Pear Silhouette */}
          <path
            d="M44 34C44 30 56 30 56 34C56 46 68 56 68 68C68 76 60 82 50 82C40 82 32 76 32 68C32 56 44 46 44 34Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          {/* Green Calyx Cap */}
          <path
            d="M38 34C42 38 48 34 50 38C52 34 58 38 62 34C60 28 40 28 38 34Z"
            fill="#10B981"
          />
          <line x1="50" y1="28" x2="50" y2="20" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'jamur':
      // Hexagon shape with botanical mushroom cap
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 6L88 28V72L50 94L12 72V28L50 6Z" fill={info.color} />
          <path d="M50 14L81 32V68L50 86L19 68V32L50 14Z" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.4" />
          {/* Mushroom Stem */}
          <rect x="44" y="52" width="12" height="26" rx="5" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Mushroom Cap Dome */}
          <path
            d="M26 54C26 36 36 26 50 26C64 26 74 36 74 54C74 56 70 56 50 56C30 56 26 56 26 54Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          {/* Mushroom Spots */}
          <circle cx="40" cy="38" r="3.5" fill={info.color} />
          <circle cx="58" cy="36" r="4.5" fill={info.color} />
          <circle cx="50" cy="46" r="3" fill={info.color} />
        </svg>
      );

    case 'brokoli':
      // 5-point Star shape with lush green broccoli floret
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="50,5 63,35 95,38 71,60 78,92 50,75 22,92 29,60 5,38 37,35"
            fill={info.color}
          />
          {/* Broccoli Stem */}
          <path d="M46 56L44 78H56L54 56" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Fluffy Crown Clouds */}
          <circle cx="50" cy="38" r="14" fill="#FFFFFF" fillOpacity="0.95" />
          <circle cx="38" cy="46" r="11" fill="#FFFFFF" fillOpacity="0.95" />
          <circle cx="62" cy="46" r="11" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Internal Leaf Speckles */}
          <circle cx="48" cy="36" r="3" fill={info.color} />
          <circle cx="56" cy="42" r="2.5" fill={info.color} />
          <circle cx="40" cy="46" r="2.5" fill={info.color} />
        </svg>
      );

    default:
      return null;
  }
};

export const SpiceIcon = VeggieIcon;
