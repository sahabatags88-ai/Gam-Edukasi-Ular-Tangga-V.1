import React from 'react';
import { LADDERS, SNAKES } from '../config/gameConfig';

function getCellCenter(n: number): { x: number; y: number } {
  const cell = Math.max(1, Math.min(100, n));
  const rowFromBottom = Math.floor((cell - 1) / 10);
  const rowFromTop = 9 - rowFromBottom;

  let col = 0;
  if (rowFromBottom % 2 === 0) {
    // Left to right (baris 1, 3, 5, 7, 9)
    col = (cell - 1) % 10;
  } else {
    // Right to left (baris 2, 4, 6, 8, 10)
    col = 9 - ((cell - 1) % 10);
  }

  return {
    x: col * 100 + 50,
    y: rowFromTop * 100 + 50,
  };
}

interface BoardConnectorsProps {
  activeSnakeCell?: number | null;
  activeLadderCell?: number | null;
}

export const BoardConnectors: React.FC<BoardConnectorsProps> = ({
  activeSnakeCell,
  activeLadderCell,
}) => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Glow Filters */}
        <filter id="glow-ladder" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.8" />
        </filter>
        <filter id="glow-snake" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f43f5e" floodOpacity="0.85" />
        </filter>
        <filter id="glow-snake-active" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#ff0055" floodOpacity="1" />
        </filter>
        <filter id="glow-ladder-active" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#34d399" floodOpacity="1" />
        </filter>

        {/* Snake Skin Gradients */}
        <linearGradient id="snakeSkin1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e11d48" />
          <stop offset="50%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>
        <linearGradient id="snakeSkin2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#4c0519" />
        </linearGradient>

        {/* Ladder Wood Gradient */}
        <linearGradient id="ladderWood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Render Ladders (Section 5: Tangga dengan glow & detail visual) */}
      {LADDERS.map((ladder, idx) => {
        const start = getCellCenter(ladder.from);
        const end = getCellCenter(ladder.to);
        const isActive = activeLadderCell === ladder.from;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = (-dy / len) * 9;
        const perpY = (dx / len) * 9;

        const numRungs = Math.max(3, Math.floor(len / 32));
        const rungs = [];
        for (let i = 1; i < numRungs; i++) {
          const t = i / numRungs;
          const rx = start.x + dx * t;
          const ry = start.y + dy * t;
          rungs.push({
            x1: rx - perpX,
            y1: ry - perpY,
            x2: rx + perpX,
            y2: ry + perpY,
          });
        }

        return (
          <g
            key={`ladder-${idx}`}
            className={isActive ? 'animate-ladderGlow' : ''}
            filter={isActive ? 'url(#glow-ladder-active)' : 'url(#glow-ladder)'}
            opacity={isActive ? 1 : 0.9}
          >
            {/* Left Rail */}
            <line
              x1={start.x - perpX}
              y1={start.y - perpY}
              x2={end.x - perpX}
              y2={end.y - perpY}
              stroke="url(#ladderWood)"
              strokeWidth={isActive ? '5' : '4'}
              strokeLinecap="round"
            />
            {/* Right Rail */}
            <line
              x1={start.x + perpX}
              y1={start.y + perpY}
              x2={end.x + perpX}
              y2={end.y + perpY}
              stroke="url(#ladderWood)"
              strokeWidth={isActive ? '5' : '4'}
              strokeLinecap="round"
            />
            {/* Rungs */}
            {rungs.map((r, rIdx) => (
              <line
                key={`rung-${rIdx}`}
                x1={r.x1}
                y1={r.y1}
                x2={r.x2}
                y2={r.y2}
                stroke="#6ee7b7"
                strokeWidth={isActive ? '3.5' : '2.5'}
                strokeLinecap="round"
              />
            ))}
            {/* Destination Sparkle Ring */}
            <circle
              cx={end.x}
              cy={end.y}
              r={isActive ? '12' : '8'}
              fill="#10b981"
              stroke="#a7f3d0"
              strokeWidth="2.5"
            />
            {isActive && (
              <circle
                cx={end.x}
                cy={end.y}
                r="18"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-spin"
              />
            )}
          </g>
        );
      })}

      {/* Render Snakes: BENAR-BENAR TERLIHAT SEBAGAI ULAR (Section 2 & 3) */}
      {SNAKES.map((snake, idx) => {
        const head = getCellCenter(snake.from);
        const tail = getCellCenter(snake.to);
        const isActive = activeSnakeCell === snake.from;

        // Curve vector calculation
        const dx = tail.x - head.x;
        const dy = tail.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const unitDx = dx / dist;
        const unitDy = dy / dist;
        const perpX = -unitDy;
        const perpY = unitDx;

        // S-curve wave points for lifelike snake body
        const curvature = 45 * (idx % 2 === 0 ? 1 : -1);
        const c1X = head.x + (dx * 0.3) + (perpX * curvature);
        const c1Y = head.y + (dy * 0.3) + (perpY * curvature);
        const c2X = head.x + (dx * 0.7) - (perpX * (curvature * 0.7));
        const c2Y = head.y + (dy * 0.7) - (perpY * (curvature * 0.7));

        const bodyPath = `M ${head.x} ${head.y} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${tail.x} ${tail.y}`;

        // Head orientation angle (in degrees)
        const headAngle = Math.atan2(c1Y - head.y, c1X - head.x) * (180 / Math.PI);

        // Scales segment count
        const numScales = 8;
        const scaleDots = [];
        for (let s = 1; s <= numScales; s++) {
          const t = s / (numScales + 1);
          // approximate bezier point
          const it = 1 - t;
          const px = it * it * it * head.x + 3 * it * it * t * c1X + 3 * it * t * t * c2X + t * t * t * tail.x;
          const py = it * it * it * head.y + 3 * it * it * t * c1Y + 3 * it * t * t * c2Y + t * t * t * tail.y;
          scaleDots.push({ x: px, y: py, r: Math.max(2.5, 6 * (1 - t * 0.5)) });
        }

        return (
          <g
            key={`snake-${idx}`}
            className={isActive ? 'animate-snakePulse' : 'animate-snakeSway'}
            filter={isActive ? 'url(#glow-snake-active)' : 'url(#glow-snake)'}
            opacity={isActive ? 1 : 0.95}
          >
            {/* 1. Outer Dark Shadow / Belly */}
            <path
              d={bodyPath}
              fill="none"
              stroke="#4c0519"
              strokeWidth={isActive ? '16' : '13'}
              strokeLinecap="round"
            />

            {/* 2. Main Scaled Body */}
            <path
              d={bodyPath}
              fill="none"
              stroke={idx % 2 === 0 ? 'url(#snakeSkin1)' : 'url(#snakeSkin2)'}
              strokeWidth={isActive ? '12' : '9'}
              strokeLinecap="round"
            />

            {/* 3. Dorsal Diamond Stripes / Viper Pattern */}
            <path
              d={bodyPath}
              fill="none"
              stroke="#fecdd3"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              strokeLinecap="round"
            />

            {/* 4. Segment Scales */}
            {scaleDots.map((dot, sIdx) => (
              <circle
                key={`scale-${sIdx}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill="#fb7185"
                opacity="0.8"
              />
            ))}

            {/* 5. Tail Rattle / Tip */}
            <circle
              cx={tail.x}
              cy={tail.y}
              r={isActive ? '6' : '4.5'}
              fill="#9f1239"
              stroke="#fecdd3"
              strokeWidth="1.5"
            />

            {/* 6. Snake Head with Eyes, Crown and Flicking Tongue */}
            <g transform={`translate(${head.x}, ${head.y}) rotate(${headAngle - 90})`}>
              {/* Flicking Forked Tongue */}
              <g className="animate-tongue">
                <line x1="0" y1="-10" x2="0" y2="-20" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="-20" x2="-3.5" y2="-24" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="0" y1="-20" x2="3.5" y2="-24" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
              </g>

              {/* Head Base (Viper / Cobra shape) */}
              <path
                d="M 0 -13 C 11 -11, 13 4, 0 10 C -13 4, -11 -11, 0 -13 Z"
                fill={isActive ? '#e11d48' : '#be123c'}
                stroke="#fff1f2"
                strokeWidth="2"
              />

              {/* Head Crown Highlight */}
              <path
                d="M 0 -8 C 4 -7, 5 0, 0 3 C -5 0, -4 -7, 0 -8 Z"
                fill="#fda4af"
                opacity="0.9"
              />

              {/* Left Eye */}
              <circle cx="-5" cy="-4" r="2.5" fill="#fef08a" stroke="#000" strokeWidth="0.8" />
              <ellipse cx="-5" cy="-4" rx="0.8" ry="1.8" fill="#000" />

              {/* Right Eye */}
              <circle cx="5" cy="-4" r="2.5" fill="#fef08a" stroke="#000" strokeWidth="0.8" />
              <ellipse cx="5" cy="-4" rx="0.8" ry="1.8" fill="#000" />

              {/* Nostril Dots */}
              <circle cx="-1.5" cy="-9" r="0.6" fill="#4c0519" />
              <circle cx="1.5" cy="-9" r="0.6" fill="#4c0519" />
            </g>
          </g>
        );
      })}
    </svg>
  );
};
