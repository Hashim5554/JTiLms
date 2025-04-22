import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 100, height = 100, className = '' }: LogoProps) {
  // Use a simple text-based fallback to ensure component renders
  return (
    <div 
      className={`flex items-center justify-center bg-red-600 text-white font-bold rounded-md ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        fontSize: `${Math.min(width, height) / 3}px` 
      }}
    >
      LGS
    </div>
  );
}