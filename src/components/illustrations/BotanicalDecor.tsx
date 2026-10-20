import React from 'react';

interface BotanicalProps {
  className?: string;
  size?: number;
  color?: string;
}

export const FloralBranch: React.FC<BotanicalProps> = ({
  className = '',
  size = 120,
  color = '#D99AA6'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 80 Q45 55 80 20"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Leaves */}
    <path
      d="M35 68 C30 60 33 50 42 53 C45 61 40 67 35 68 Z"
      fill={color}
      fillOpacity="0.45"
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M48 55 C56 50 63 56 60 65 C51 64 48 58 48 55 Z"
      fill={color}
      fillOpacity="0.45"
      stroke={color}
      strokeWidth="1.5"
    />
    <path
      d="M62 38 C58 29 63 20 72 24 C74 32 68 37 62 38 Z"
      fill={color}
      fillOpacity="0.45"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Delicate buds */}
    <circle cx="78" cy="22" r="4.5" fill="#6F3347" />
    <circle cx="34" cy="52" r="3" fill="#D99AA6" />
    <circle cx="62" cy="62" r="3" fill="#B8C6B0" />
  </svg>
);

export const CycleCareLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 56,
  className = ''
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Subtle petal outline */}
    <path
      d="M50 12 C35 32 18 48 18 68 C18 83 32 92 50 92 C68 92 82 83 82 68 C82 48 65 32 50 12 Z"
      fill="#F2D8DC"
      fillOpacity="0.8"
    />
    {/* Inner petal in dusty rose */}
    <path
      d="M50 28 C40 42 30 54 30 68 C30 79 39 86 50 86 C61 86 70 79 70 68 C70 54 60 42 50 28 Z"
      fill="#D99AA6"
    />
    {/* Heart/Core in deep burgundy */}
    <path
      d="M50 44 C45 52 40 59 40 68 C40 74 44 78 50 78 C56 78 60 74 60 68 C60 59 55 52 50 44 Z"
      fill="#6F3347"
    />
    {/* Soft highlight */}
    <circle cx="50" cy="54" r="2.5" fill="#FFFFFF" fillOpacity="0.9" />
  </svg>
);

export const WreathCircle: React.FC<{ size?: number; progress?: number; className?: string }> = ({
  size = 220,
  progress = 0.65,
  className = ''
}) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
    >
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="#F2EDE5"
        strokeWidth="10"
      />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="url(#roseGradient)"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <defs>
        <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D99AA6" />
          <stop offset="100%" stopColor="#6F3347" />
        </linearGradient>
      </defs>
    </svg>
  );
};
