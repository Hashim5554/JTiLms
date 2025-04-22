import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme'; // Fixed import path

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 100, height = 100, className = '' }: LogoProps) {
  // Add fallback state to ensure component doesn't crash
  const [logoSrc, setLogoSrc] = useState("/lgs-logo.png");
  
  // Use try-catch to handle any theme hook errors
  try {
    const { theme } = useTheme();
    
    // Use useEffect to safely update the logo source
    useEffect(() => {
      const isDarkMode = theme === 'dark';
      setLogoSrc(isDarkMode ? "/lgs-logo-white.png" : "/lgs-logo.png");
    }, [theme]);
  } catch (error) {
    console.error("Error using theme hook:", error);
    // Keep using default logo if theme hook fails
  }
  
  return (
    <img
      src={logoSrc}
      alt="LGS Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
      onError={() => setLogoSrc("/lgs-logo.png")} // Fallback if image fails to load
    />
  );
}