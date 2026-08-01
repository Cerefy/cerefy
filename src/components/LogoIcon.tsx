import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = ({ className = 'h-8 w-8', size, color }) => {
  const strokeColor = color || 'currentColor';
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Top 'C' Arc (Circle with right opening) */}
      <path
        d="M 62.5 22.5 A 15 15 0 1 0 62.5 41.5"
        stroke={strokeColor}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Center Triangle Backbone */}
      <polygon
        points="50,32 32,68 68,68"
        stroke={strokeColor}
        strokeWidth="7"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom-Left Circle Node */}
      <circle
        cx="32"
        cy="68"
        r="15"
        stroke={strokeColor}
        strokeWidth="7"
        fill="none"
      />

      {/* Bottom-Right Circle Node */}
      <circle
        cx="68"
        cy="68"
        r="15"
        stroke={strokeColor}
        strokeWidth="7"
        fill="none"
      />

      {/* Bright Cyan 4-Point Sparkle Star on Top Right */}
      <path
        d="M 73 12 C 73 18.5 76.5 22 83 22 C 76.5 22 73 25.5 73 32 C 73 25.5 69.5 22 63 22 C 69.5 22 73 18.5 73 12 Z"
        fill="#00D8F6"
      />
    </svg>
  );
};



