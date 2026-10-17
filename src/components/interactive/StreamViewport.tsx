import type { ReactNode } from 'react'

/**
 * A simulated broadcast frame drawn in SVG — an abstract game world, a LIVE
 * tag, and a facecam. Used by the visual-interactions and creator-control
 * previews. Children render as overlay content inside the frame.
 */
export function StreamViewport({ children, className = '', label }: { children?: ReactNode; className?: string; label: string }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-[#0B1317] ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 640 360" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="vp-glow" cx="55%" cy="62%" r="60%">
            <stop offset="0%" stopColor="#0B838C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0B838C" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="360" fill="url(#vp-glow)" />
        <path d="M0 230 Q 90 190 180 215 T 360 205 T 520 200 T 640 210 V360 H0Z" fill="#14262C" />
        <path d="M0 262 Q 120 240 240 258 T 460 250 T 640 256 V360 H0Z" fill="#102026" />
        <path d="M0 300 Q 140 286 300 296 T 640 292 V360 H0Z" fill="#0C181D" />
        {Array.from({ length: 13 }, (_, i) => (
          <line key={i} x1={320 + (i - 6) * 12} y1="310" x2={320 + (i - 6) * 80} y2="360" stroke="#38DDE8" strokeOpacity="0.1" />
        ))}
        <rect x="22" y="20" width="62" height="24" rx="6" fill="#FF7048" />
        <text x="53" y="37" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontSize="13" fontWeight="700" fill="#080C0F">
          LIVE
        </text>
        <rect x="486" y="236" width="132" height="100" rx="10" fill="#16232A" stroke="#F3F1E9" strokeOpacity="0.2" />
        <circle cx="552" cy="276" r="18" fill="#2A3A42" />
        <path d="M512 336 a40 32 0 0 1 80 0Z" fill="#2A3A42" />
      </svg>
      {children}
    </div>
  )
}
