import React from 'react';

interface PahariLogoProps {
  className?: string;
  size?: number;
}

export default function PahariLogo({ className = '', size = 80 }: PahariLogoProps) {
  // We can scale the logo using the size prop or via tailwind className
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 400 400"
      className={`select-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Curved path for the top text (clockwise) */}
        <path
          id="text-path-top"
          d="M 40,200 A 160,160 0 1,1 360,200"
          fill="none"
        />
        {/* Curved path for the bottom text (clockwise) */}
        <path
          id="text-path-bottom"
          d="M 360,200 A 160,160 0 0,1 40,200"
          fill="none"
        />
        {/* Drop shadow for bowl and mountain */}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Green Border Ring */}
      <circle cx="200" cy="200" r="190" fill="#ffffff" stroke="#166534" strokeWidth="8" />
      <circle cx="200" cy="200" r="176" fill="none" stroke="#166534" strokeWidth="2" />

      {/* Top Bengali Text: পাহাড়ী রেস্তোরাঁ ফাস্ট-ফুড এন্ড জুস বার */}
      <text fill="#166534" className="font-sans font-extrabold text-[15.5px] tracking-wider uppercase">
        <textPath href="#text-path-top" startOffset="50%" textAnchor="middle">
          পাহাড়ী রেস্তোরাঁ ফাস্ট-ফুড এন্ড জুস বার
        </textPath>
      </text>

      {/* Bottom Bengali Text: প্রাকৃতিক স্বাদ - বিশুদ্ধতা - পরিচ্ছন্নতা */}
      <text fill="#166534" className="font-sans font-extrabold text-[15px] tracking-wider">
        <textPath href="#text-path-bottom" startOffset="50%" textAnchor="middle">
          প্রাকৃতিক স্বাদ - বিশুদ্ধতা - পরিচ্ছন্নতা
        </textPath>
      </text>

      {/* Left Crossed Fork & Spoon */}
      <g transform="translate(48, 200) scale(0.9)">
        {/* Fork */}
        <path
          d="M -12,-20 L -12,5 M -15,-20 L -9,-20 M -15,-20 L -15,-10 L -9,-10 L -9,-20 M -12,5 L -12,20"
          stroke="#ca8a04"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Spoon */}
        <path
          d="M 12,-15 C 6,-15 6,-5 12,-5 C 18,-5 18,-15 12,-15 Z M 12,-5 L 12,20"
          stroke="#ca8a04"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Cross details */}
        <path d="M -12,-2 L 12,12" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 12,-2 L -12,12" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Right Crossed Fork & Spoon */}
      <g transform="translate(352, 200) scale(0.9)">
        {/* Fork */}
        <path
          d="M -12,-20 L -12,5 M -15,-20 L -9,-20 M -15,-20 L -15,-10 L -9,-10 L -9,-20 M -12,5 L -12,20"
          stroke="#ca8a04"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Spoon */}
        <path
          d="M 12,-15 C 6,-15 6,-5 12,-5 C 18,-5 18,-15 12,-15 Z M 12,-5 L 12,20"
          stroke="#ca8a04"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Cross details */}
        <path d="M -12,-2 L 12,12" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 12,-2 L -12,12" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Inner Circle Ring with background and green border */}
      <circle cx="200" cy="200" r="145" fill="#ffffff" stroke="#166534" strokeWidth="4" />

      {/* Mountain Landscape & Central Assets */}
      <g filter="url(#shadow)">
        {/* Mountain Base Peaks */}
        {/* Back Peak */}
        <path
          d="M 110,210 L 200,120 L 290,210 Z"
          fill="#14532d"
        />
        {/* Front overlapping Peak with highlight */}
        <path
          d="M 80,210 L 200,105 L 320,210 Z"
          fill="#16a34a"
        />
        {/* Mountain Highlights (shading lines) */}
        <path
          d="M 200,105 L 200,210 L 320,210 Z"
          fill="#15803d"
          opacity="0.3"
        />
        <path
          d="M 200,105 L 180,210 L 80,210 Z"
          fill="#ffffff"
          opacity="0.15"
        />

        {/* Trees on Left of Mountain */}
        <g transform="translate(100, 180) scale(1.1)">
          <rect x="-2" y="0" width="4" height="15" fill="#78350f" rx="1" />
          <path d="M -12,4 L 12,4 L 0,-14 Z" fill="#15803d" />
          <path d="M -9,-4 L 9,-4 L 0,-18 Z" fill="#166534" />
          <path d="M -6,-10 L 6,-10 L 0,-22 Z" fill="#15803d" />
        </g>

        {/* Trees on Right of Mountain */}
        <g transform="translate(300, 180) scale(1.1)">
          <rect x="-2" y="0" width="4" height="15" fill="#78350f" rx="1" />
          <path d="M -12,4 L 12,4 L 0,-14 Z" fill="#15803d" />
          <path d="M -9,-4 L 9,-4 L 0,-18 Z" fill="#166534" />
          <path d="M -6,-10 L 6,-10 L 0,-22 Z" fill="#15803d" />
        </g>

        {/* Steaming Bowl (Placed perfectly at the mountain peak top center) */}
        <g transform="translate(200, 85) scale(1.1)">
          {/* Steam rising */}
          <path
            d="M -10,-20 C -15,-13 -10,-6 -15,0"
            fill="none"
            stroke="#ea580c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 0,-24 C -5,-16 0,-8 -5,0"
            fill="none"
            stroke="#ea580c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 10,-20 C 5,-13 10,-6 5,0"
            fill="none"
            stroke="#ea580c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Soup / Food Bowl */}
          <path
            d="M -32,0 C -32,18 32,18 32,0 Z"
            fill="#d97706"
          />
          {/* Bowl Rim Highlight */}
          <ellipse cx="0" cy="0" rx="32" ry="3" fill="#ca8a04" />
          {/* Bowl Base */}
          <path
            d="M -14,14 L 14,14 L 10,18 L -10,18 Z"
            fill="#b45309"
          />
        </g>
      </g>

      {/* Brand Texts in the lower part of the inner circle */}
      <g transform="translate(200, 248)">
        {/* "PAHARI RESTORA" */}
        <text
          textAnchor="middle"
          fill="#15803d"
          className="font-sans font-black text-[23px] tracking-[1.5px]"
        >
          PAHARI RESTORA
        </text>

        {/* "FAST FOOD & JUICE BAR" */}
        <text
          y="23"
          textAnchor="middle"
          fill="#166534"
          className="font-sans font-bold text-[13.5px] tracking-[3px]"
        >
          FAST FOOD & JUICE BAR
        </text>

        {/* Divider Line */}
        <line
          x1="-105"
          y1="34"
          x2="105"
          y2="34"
          stroke="#ea580c"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* "Natural Taste - Purity - Cleanliness" (in Orange) */}
        <text
          y="48"
          textAnchor="middle"
          fill="#ea580c"
          className="font-sans font-bold text-[9.5px] tracking-[0.5px]"
        >
          Natural Taste - Purity - Cleanliness
        </text>
      </g>
    </svg>
  );
}
