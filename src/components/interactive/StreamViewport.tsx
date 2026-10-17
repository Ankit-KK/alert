import type { ReactNode } from 'react'

/**
 * The page's sample broadcast still: a made-up hover-racing game rendered for
 * this page. It is scaled up slightly from its lower right so the game's own
 * minimap and progress bar fall outside the frame, which leaves the top-left
 * corner free for stream chrome. Decorative; always paired with a labelled
 * container or an aria-hidden wrapper.
 */
export function StreamFrameImage({ className = '', eager = false }: { className?: string; eager?: boolean }) {
  return (
    <img
      src="/media/stream-frame.webp"
      alt=""
      width={1600}
      height={900}
      decoding="async"
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      className={`absolute inset-0 h-full w-full origin-[85%_80%] scale-[1.15] object-cover select-none ${className}`}
    />
  )
}

/** Broadcast "LIVE" tag in signal orange. */
export function LiveBadge({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-1.5 rounded-[5px] bg-signal px-1.5 py-[3px] font-display text-[11px] leading-none font-bold tracking-[0.12em] text-obsidian shadow-[0_4px_14px_-4px_rgba(255,112,72,0.7)] ${className}`}
    >
      <span className="animate-live h-1.5 w-1.5 rounded-full bg-obsidian" />
      LIVE
    </span>
  )
}

/**
 * A simulated broadcast frame — the sample game footage, a LIVE tag and a
 * soft top/bottom vignette so overlays stay legible. Used by the
 * visual-interactions and creator-control previews. Children render as
 * overlay content inside the frame.
 */
export function StreamViewport({ children, className = '', label }: { children?: ReactNode; className?: string; label: string }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-[#0B1317] ${className}`} role="img" aria-label={label}>
      <StreamFrameImage />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,15,0.55)_0%,rgba(8,12,15,0)_26%,rgba(8,12,15,0)_58%,rgba(8,12,15,0.7)_100%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,rgba(8,12,15,0)_60%,rgba(8,12,15,0.45)_100%)]"
      />
      <LiveBadge className="absolute top-[5%] left-[3.5%]" />
      {children}
    </div>
  )
}
