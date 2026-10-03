import React from 'react';

interface KubeDataFlowLogoProps {
  className?: string;
  size?: number | string;
}

export const KubeDataFlowLogo: React.FC<KubeDataFlowLogoProps> = ({ 
  className = "w-10 h-10", 
  size 
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_16px_rgba(14,165,233,0.4)]"
      >
        <defs>
          {/* Hexagon Outer Facet Gradients */}
          <linearGradient id="kdf-outer-hex" x1="60" y1="4" x2="60" y2="116" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="30%" stopColor="#0ea5e9" />
            <stop offset="70%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Isometric Frame Inner Bevel Gradient */}
          <linearGradient id="kdf-frame-top" x1="15" y1="10" x2="105" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>

          <linearGradient id="kdf-frame-right" x1="60" y1="20" x2="108" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          <linearGradient id="kdf-frame-left" x1="12" y1="30" x2="60" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Deep Dark Isometric Interior */}
          <radialGradient id="kdf-interior-glow" cx="60" cy="60" r="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0e2a47" />
            <stop offset="60%" stopColor="#06182c" />
            <stop offset="100%" stopColor="#020b17" />
          </radialGradient>

          {/* Database Top Cap Glow */}
          <linearGradient id="kdf-db-cap" x1="40" y1="34" x2="80" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Database Cylinder Horizontal 3D Shading */}
          <linearGradient id="kdf-db-body" x1="38" y1="0" x2="82" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="25%" stopColor="#38bdf8" />
            <stop offset="65%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Disk Groove Shadow */}
          <linearGradient id="kdf-db-gap" x1="38" y1="0" x2="82" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
        </defs>

        {/* 1. OUTER ISOMETRIC HEXAGON FRAME WITH 3D DEPTH */}
        
        {/* Outer Hexagon Base */}
        <polygon
          points="60,6 106,32.5 106,87.5 60,114 14,87.5 14,32.5"
          fill="url(#kdf-outer-hex)"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Inner Chamber (Hole) creating the thick border */}
        <polygon
          points="60,18 96,39 96,81 60,102 24,81 24,39"
          fill="url(#kdf-interior-glow)"
          stroke="#075985"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* 3D Isometric Frame Edge Bevels */}
        {/* Top vertex connection */}
        <line x1="60" y1="6" x2="60" y2="18" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
        {/* Top-right vertex connection */}
        <line x1="106" y1="32.5" x2="96" y2="39" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        {/* Bottom-right vertex connection */}
        <line x1="106" y1="87.5" x2="96" y2="81" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        {/* Bottom vertex connection */}
        <line x1="60" y1="114" x2="60" y2="102" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        {/* Bottom-left vertex connection */}
        <line x1="14" y1="87.5" x2="24" y2="81" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
        {/* Top-left vertex connection */}
        <line x1="14" y1="32.5" x2="24" y2="39" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

        {/* Interior Wireframe/Isometric Cube Depth Lines meeting at center */}
        <line x1="60" y1="60" x2="60" y2="102" stroke="#0284c7" strokeWidth="1.5" opacity="0.4" />
        <line x1="60" y1="60" x2="24" y2="39" stroke="#0284c7" strokeWidth="1.5" opacity="0.4" />
        <line x1="60" y1="60" x2="96" y2="39" stroke="#0284c7" strokeWidth="1.5" opacity="0.4" />

        {/* 2. CENTRAL 3D DATABASE CYLINDER (3 STACKED DISK LAYERS) */}

        {/* === LAYER 3 (BOTTOM DISK) === */}
        {/* Bottom body */}
        <path
          d="M 38,67 L 38,77.5 C 38,84 47.8,89.5 60,89.5 C 72.2,89.5 82,84 82,77.5 L 82,67 Z"
          fill="url(#kdf-db-body)"
        />
        {/* Bottom rim/top ellipse */}
        <ellipse cx="60" cy="67" rx="22" ry="7" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" />

        {/* === LAYER 2 (MIDDLE DISK) === */}
        {/* Middle body */}
        <path
          d="M 38,52 L 38,62.5 C 38,69 47.8,74.5 60,74.5 C 72.2,74.5 82,69 82,62.5 L 82,52 Z"
          fill="url(#kdf-db-body)"
        />
        {/* Middle rim/top ellipse */}
        <ellipse cx="60" cy="52" rx="22" ry="7" fill="#0ea5e9" stroke="#7dd3fc" strokeWidth="0.8" />

        {/* === LAYER 1 (TOP DISK & ILLUMINATED CAP) === */}
        {/* Top body */}
        <path
          d="M 38,37 L 38,47.5 C 38,54 47.8,59.5 60,59.5 C 72.2,59.5 82,54 82,47.5 L 82,37 Z"
          fill="url(#kdf-db-body)"
        />
        {/* Top glowing cap */}
        <ellipse 
          cx="60" 
          cy="37" 
          rx="22" 
          ry="7.2" 
          fill="url(#kdf-db-cap)" 
          stroke="#ffffff" 
          strokeWidth="0.8"
        />

        {/* Specular White Shine on Top Cap */}
        <ellipse cx="56" cy="35.5" rx="14" ry="3.8" fill="#ffffff" opacity="0.4" />
        
        {/* Left Vertical Curvature Highlight Streak */}
        <path
          d="M 44,38 L 44,81"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    </div>
  );
};
