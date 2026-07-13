// SailLogo.jsx — uses the actual uploaded PNG logo
import React from 'react';

// Inline the logo as a component using the public path
export default function SailLogo({ size = 58, className = '' }) {
  return (
    <img
      src="/sail-logo.png"
      alt="SAIL Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain',  transform: 'scale(1.9)' }}
    />
  );
}

// SVG fallback that matches the exact logo shape for places needing SVG
export function SailLogoSVG({ size = 58, color = '#1B2A6B', textColor = '#1B2A6B' }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 200 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer diamond */}
      <polygon points="100,4 196,100 100,196 4,100" fill={color}/>
      {/* White inner diamond ring */}
      <polygon points="100,22 178,100 100,178 22,100" fill="white"/>
      {/* Navy house body */}
      <polygon points="100,40 160,100 160,158 40,158 40,100" fill={color}/>
      {/* White roof triangle cutout */}
      <polygon points="100,46 152,102 48,102" fill="white"/>
      {/* White door */}
      <rect x="82" y="108" width="36" height="50" fill="white"/>
      {/* Inner small diamond on door top */}
      <polygon points="100,88 118,106 100,124 82,106" fill={color}/>
      {/* "सेल SAIL" text */}
      <text x="100" y="232" textAnchor="middle" fill={textColor}
        fontSize="28" fontFamily="serif" fontWeight="bold" letterSpacing="4">
        सेल SAIL
      </text>
    </svg>
  );
}
