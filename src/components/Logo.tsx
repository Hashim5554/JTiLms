import React from 'react';
import { useTheme } from '../hooks/useTheme'; // Fixed import path

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 100, height = 100, className = '' }: LogoProps) {
  const { theme } = useTheme(); // Get current theme state
  const isDarkMode = theme === 'dark';
  
  return (
    <img
      src={isDarkMode ? "/lgs-logo-white.png" : "/lgs-logo.png"}
      alt="LGS Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}