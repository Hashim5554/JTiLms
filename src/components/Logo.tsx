import React from 'react';

export function Logo() {
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background */}
      <rect width="100" height="100" fill="#FF0000"/>
      
      {/* Main diagonal shape */}
      <path 
        d="M20 80 L50 20 L80 80 Z" 
        fill="white"
      />
      
      {/* Circle */}
      <circle 
        cx="80" 
        cy="20" 
        r="15" 
        fill="white"
      />
    </svg>
  );
}