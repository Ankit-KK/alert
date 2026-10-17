/**
 * Lightweight, non-WebGL rendition of the Interaction Engine. Shown while the
 * 3D chunk loads, and permanently when WebGL is unavailable or disabled.
 * Pure SVG + CSS, decorative only.
 */
export function StaticStage({ visible }: { visible: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2
    const h = 10 + Math.abs(Math.sin(i * 0.9)) * 26
    return { a, h }
  })

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <svg
        viewBox="0 0 800 600"
        className="absolute top-[6%] left-1/2 w-[150%] max-w-none -translate-x-1/2 sm:top-[12%] sm:w-[92%] md:left-auto md:right-[-12%] md:w-[62%] md:translate-x-0 lg:right-[-6%] lg:w-[54%]"
      >
        <defs>
          <radialGradient id="hc-glow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#0B838C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0B838C" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="400" cy="420" rx="360" ry="200" fill="url(#hc-glow)" />
        {/* Display */}
        <rect x="190" y="70" width="420" height="250" rx="16" fill="#1B252B" stroke="#26333A" strokeWidth="2" />
        <rect x="204" y="84" width="392" height="222" rx="8" fill="#0B1317" />
        <path d="M204 250 Q 300 215 400 240 T 596 228 V306 H204Z" fill="#14262C" />
        <path d="M204 275 Q 320 250 430 270 T 596 262 V306 H204Z" fill="#0F1E23" />
        <rect x="220" y="100" width="58" height="22" rx="6" fill="#FF7048" />
        <text x="249" y="116" textAnchor="middle" fontFamily="Space Grotesk Variable, sans-serif" fontWeight="700" fontSize="12" fill="#080C0F">
          LIVE
        </text>
        <rect x="222" y="262" width="190" height="34" rx="10" fill="#080C0F" stroke="#38DDE8" strokeWidth="2" />
        <rect x="232" y="271" width="4" height="16" rx="2" fill="#38DDE8" />
        <rect x="246" y="273" width="90" height="5" rx="2.5" fill="#38DDE8" />
        <rect x="246" y="283" width="140" height="5" rx="2.5" fill="#F3F1E9" opacity="0.8" />
        {/* Neck + core */}
        <rect x="395" y="320" width="10" height="44" fill="#3A464C" />
        <ellipse cx="400" cy="398" rx="120" ry="34" fill="#2B363C" />
        <ellipse cx="400" cy="384" rx="112" ry="30" fill="#1B252B" stroke="#38DDE8" strokeOpacity="0.7" strokeWidth="2" />
        <ellipse cx="400" cy="350" rx="70" ry="22" fill="none" stroke="#E6E3D8" strokeOpacity="0.7" strokeWidth="2.5" />
        <ellipse cx="400" cy="350" rx="52" ry="15" fill="none" stroke="#3A464C" strokeWidth="2" />
        {bars.map(({ a, h }, i) => {
          const x = 400 + Math.cos(a) * 160
          const y = 392 + Math.sin(a) * 46
          return <rect key={i} x={x - 2} y={y - h} width="4" height={h} rx="2" fill="#D7DCD9" opacity={0.25 + 0.5 * ((Math.sin(a) + 1) / 2)} />
        })}
        {/* Message cards */}
        <g opacity="0.95">
          <rect x="40" y="150" width="170" height="46" rx="10" fill="#1B252B" />
          <circle cx="64" cy="173" r="11" fill="#F3F1E9" />
          <rect x="84" y="164" width="60" height="6" rx="3" fill="#A4B0B6" />
          <rect x="84" y="176" width="104" height="7" rx="3.5" fill="#F3F1E9" />
          <rect x="600" y="110" width="170" height="46" rx="10" fill="#1B252B" />
          <circle cx="624" cy="133" r="11" fill="#38DDE8" />
          <rect x="644" y="124" width="60" height="6" rx="3" fill="#A4B0B6" />
          <rect x="644" y="136" width="96" height="7" rx="3.5" fill="#F3F1E9" />
          <rect x="612" y="250" width="170" height="46" rx="10" fill="#1B252B" />
          <circle cx="636" cy="273" r="11" fill="#FF7048" />
          <rect x="656" y="264" width="60" height="6" rx="3" fill="#A4B0B6" />
          <rect x="656" y="276" width="100" height="7" rx="3.5" fill="#F3F1E9" />
        </g>
      </svg>
    </div>
  )
}
