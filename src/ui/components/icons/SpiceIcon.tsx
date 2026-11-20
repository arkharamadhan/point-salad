import React from 'react';
import { ResourceId } from '../../../engine/types';

interface SpiceIconProps {
  resource: ResourceId;
  className?: string;
  size?: number;
}

export const SPICE_INFO: Record<
  ResourceId,
  {
    nameId: string;
    nameEn: string;
    color: string;
    bgColor: string;
    borderColor: string;
    shape: 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon' | 'star';
  }
> = {
  jahe: {
    nameId: 'Jahe',
    nameEn: 'Ginger',
    color: '#E69F00',
    bgColor: '#FFF5E0',
    borderColor: '#E69F00',
    shape: 'circle',
  },
  kunyit: {
    nameId: 'Kunyit',
    nameEn: 'Turmeric',
    color: '#D4AF37',
    bgColor: '#FFFDE0',
    borderColor: '#D4AF37',
    shape: 'square',
  },
  kayu_manis: {
    nameId: 'Kayu Manis',
    nameEn: 'Cinnamon',
    color: '#D55E00',
    bgColor: '#FFEAE0',
    borderColor: '#D55E00',
    shape: 'triangle',
  },
  cengkeh: {
    nameId: 'Cengkeh',
    nameEn: 'Clove',
    color: '#CC79A7',
    bgColor: '#FDF0F6',
    borderColor: '#CC79A7',
    shape: 'diamond',
  },
  pala: {
    nameId: 'Pala',
    nameEn: 'Nutmeg',
    color: '#0072B2',
    bgColor: '#E6F3FB',
    borderColor: '#0072B2',
    shape: 'hexagon',
  },
  lada: {
    nameId: 'Lada',
    nameEn: 'Pepper',
    color: '#009E73',
    bgColor: '#E3FAF3',
    borderColor: '#009E73',
    shape: 'star',
  },
};

export const SpiceIcon: React.FC<SpiceIconProps> = ({ resource, className = '', size = 24 }) => {
  const info = SPICE_INFO[resource];

  switch (resource) {
    case 'jahe':
      // Circle shape with organic ginger rhizome motif
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
          <path
            d="M32 50C32 40 40 32 50 32C55 32 62 36 65 42C69 49 68 58 62 64C56 70 45 70 38 65C34 61 32 56 32 50Z"
            fill="#FFFFFF"
            fillOpacity="0.9"
          />
          <circle cx="45" cy="46" r="4" fill={info.color} />
          <circle cx="55" cy="52" r="3" fill={info.color} />
        </svg>
      );

    case 'kunyit':
      // Square shape with sliced turmeric concentric ring
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
          <circle cx="50" cy="50" r="24" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="50" cy="50" r="14" fill={info.color} />
          <circle cx="50" cy="50" r="5" fill="#FFFFFF" fillOpacity="0.9" />
        </svg>
      );

    case 'kayu_manis':
      // Triangle shape with rolled cinnamon bark quill motif
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
          <path
            d="M44 48C44 44 48 40 52 40C56 40 60 44 60 49C60 55 54 60 48 60C40 60 36 52 36 45C36 36 44 30 54 30C66 30 72 38 72 48"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case 'cengkeh':
      // Diamond shape with clove bud head
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 5L95 50L50 95L5 50L50 5Z"
            fill={info.color}
          />
          <path
            d="M50 14L86 50L50 86L14 50L50 14Z"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          {/* Clove bud head and stem */}
          <circle cx="50" cy="40" r="12" fill="#FFFFFF" fillOpacity="0.9" />
          <rect x="46" y="44" width="8" height="24" rx="3" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="42" cy="35" r="3" fill={info.color} />
          <circle cx="58" cy="35" r="3" fill={info.color} />
        </svg>
      );

    case 'pala':
      // Hexagon shape with nutmeg kernel
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={className}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M50 6L88 28V72L50 94L12 72V28L50 6Z"
            fill={info.color}
          />
          <path
            d="M50 14L81 32V68L50 86L19 68V32L50 14Z"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeOpacity="0.4"
          />
          {/* Nutmeg seed oval */}
          <ellipse cx="50" cy="50" rx="18" ry="24" fill="#FFFFFF" fillOpacity="0.9" />
          <path
            d="M42 42C46 45 54 44 58 48M40 54C46 56 52 53 58 58"
            stroke={info.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'lada':
      // 5-point Star shape with peppercorn berries cluster
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
          <circle cx="50" cy="46" r="6" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="41" cy="56" r="5" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="59" cy="56" r="5" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="50" cy="64" r="4" fill="#FFFFFF" fillOpacity="0.9" />
        </svg>
      );

    default:
      return null;
  }
};
