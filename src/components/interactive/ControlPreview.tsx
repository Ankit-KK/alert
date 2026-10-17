import { useId, useState } from 'react'
import { AudioLines, LayoutTemplate, ListChecks, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { OVERLAY_STYLES, REVIEW_QUEUE, type OverlayStyle } from '@/content/site'
import { StreamFrameImage, StreamViewport } from './StreamViewport'
import { Switch } from './Switch'

const MODULES = [
  { label: 'Interactions', icon: SlidersHorizontal },
  { label: 'Audio', icon: AudioLines },
  { label: 'Soundboard', icon: ListChecks },
  { label: 'Overlay', icon: LayoutTemplate, current: true },
  { label: 'Message review', icon: ShieldCheck },
]

// Loudness envelope for the little voice-clip waveforms drawn in overlays.
const WAVE = [0.35, 0.62, 0.48, 0.86, 0.58, 1, 0.52, 0.78, 0.4, 0.66, 0.3, 0.46]

function MiniWave({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex h-[1em] shrink-0 items-center gap-[0.14em] ${className}`}>
      {WAVE.map((h, i) => (
        <span key={i} className="w-[0.15em] rounded-full bg-current" style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </span>
  )
}

function OverlaySample({ style, showMedia }: { style: OverlayStyle['id']; showMedia: boolean }) {
  // The spotlight gives the clip a wider, larger frame than the compact styles.
  const size = style === 'spotlight' ? { width: '5.6em', height: '3.15em' } : { width: '2.6em', height: '2.6em' }
  const media = showMedia ? (
    <span className="relative block shrink-0 overflow-hidden rounded-md bg-obsidian ring-1 ring-ivory/15" style={size}>
      <img
        src="/media/clip-boost.webp"
        alt=""
        width={720}
        height={720}
        decoding="async"
        loading="lazy"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-[50%_62%]"
      />
    </span>
  ) : null

  if (style === 'ticker') {
    return (
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t-2 border-cyan bg-obsidian/92 px-4 py-2 text-[clamp(0.6875rem,1.4vw,0.85rem)]">
        {media}
        <span className="font-display font-bold tracking-[0.06em] text-cyan">VOICE</span>
        <span className="min-w-0 truncate text-ivory">kitecat: “Run it back one more time!”</span>
        <MiniWave className="ml-auto hidden text-cyan/80 sm:flex" />
      </div>
    )
  }
  if (style === 'spotlight') {
    return (
      <div className="absolute inset-0 grid place-items-center bg-obsidian/45">
        <div className="flex max-w-[76%] flex-col items-center gap-1.5 rounded-2xl border-2 border-cyan bg-obsidian/92 px-4 py-2.5 text-center text-[clamp(0.6875rem,1.5vw,0.95rem)] shadow-[0_0_40px_-8px_rgba(56,221,232,0.55)] sm:gap-2 sm:px-5 sm:py-4">
          {media}
          <span className="font-display font-bold tracking-[0.06em] text-cyan">VOICE MESSAGE</span>
          <span className="text-ivory">kitecat: “Run it back one more time!”</span>
          <span className="hidden items-center gap-2 text-mist sm:flex">
            <MiniWave className="text-cyan" />
            <span className="font-display text-[0.85em] tabular-nums">0:04</span>
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="absolute top-[6%] right-[4%] flex max-w-[56%] items-center gap-2.5 rounded-xl border-2 border-cyan bg-obsidian/92 px-3 py-2 text-[clamp(0.6875rem,1.3vw,0.85rem)]">
      {media}
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-display font-bold tracking-[0.06em] text-cyan">
          VOICE
          <MiniWave className="hidden text-cyan/80 sm:flex" />
        </span>
        <span className="block truncate text-ivory">kitecat: “Run it back…”</span>
      </span>
    </div>
  )
}

const THUMB_WAVE = WAVE.slice(0, 9)

/** Voice glyph: a cyan disc with three short bars. */
function ThumbGlyph({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const s = r * 0.42
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#38DDE8" />
      <path
        d={`M${cx - s} ${cy - s * 0.55}v${s * 1.1}M${cx} ${cy - s}v${s * 2}M${cx + s} ${cy - s * 0.55}v${s * 1.1}`}
        stroke="#080C0F"
        strokeWidth={r * 0.24}
        strokeLinecap="round"
      />
    </g>
  )
}

/** A short waveform drawn from x, centred on y. */
function ThumbWave({ x, y, step, h, color = '#F3F1E9', opacity = 1 }: { x: number; y: number; step: number; h: number; color?: string; opacity?: number }) {
  return (
    <path
      d={THUMB_WAVE.map((v, i) => `M${(x + i * step).toFixed(1)} ${(y - (v * h) / 2).toFixed(1)}v${(v * h).toFixed(1)}`).join('')}
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={step * 0.5}
      strokeLinecap="round"
    />
  )
}

/** Tiny stream thumbnail with the overlay drawn in the given style. Decorative. */
function StyleThumb({ id }: { id: OverlayStyle['id'] }) {
  return (
    <span aria-hidden="true" className="relative mb-2.5 block aspect-video overflow-hidden rounded-md bg-obsidian ring-1 ring-line">
      <StreamFrameImage />
      <svg viewBox="0 0 160 90" className="absolute inset-0 h-full w-full">
        {id === 'minimal' && (
          <g>
            <rect x="90" y="7" width="63" height="24" rx="5" fill="#080C0F" fillOpacity="0.92" stroke="#38DDE8" strokeWidth="1.8" />
            <ThumbGlyph cx={102} cy={19} r={6.5} />
            <ThumbWave x={115} y={19} step={4} h={11} />
          </g>
        )}
        {id === 'spotlight' && (
          <g>
            <rect width="160" height="90" fill="#080C0F" fillOpacity="0.5" />
            <rect x="34" y="15" width="92" height="60" rx="8" fill="none" stroke="#38DDE8" strokeOpacity="0.3" strokeWidth="6" />
            <rect x="34" y="15" width="92" height="60" rx="8" fill="#080C0F" fillOpacity="0.94" stroke="#38DDE8" strokeWidth="2" />
            <ThumbGlyph cx={80} cy={36} r={10} />
            <ThumbWave x={64} y={58} step={4} h={10} />
          </g>
        )}
        {id === 'ticker' && (
          <g>
            <rect x="0" y="68" width="160" height="22" fill="#080C0F" fillOpacity="0.94" />
            <path d="M0 68.9H160" stroke="#38DDE8" strokeWidth="1.8" />
            <ThumbGlyph cx={12} cy={79.5} r={6} />
            <ThumbWave x={24} y={79.5} step={4} h={10} />
            <circle cx="72" cy="79.5" r="1.4" fill="#A4B0B6" />
            <circle cx="86" cy="79.5" r="6" fill="#FF7048" />
            <path d="M83 81.5l3-4 3 4" stroke="#080C0F" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <ThumbWave x={98} y={79.5} step={4} h={10} opacity={0.55} />
          </g>
        )}
      </svg>
    </span>
  )
}

/**
 * Creator studio concept preview. All state is local; nothing here talks to a
 * backend. Settings update the live preview in the same panel.
 */
export function ControlPreview() {
  const [showMedia, setShowMedia] = useState(true)
  const [holdForReview, setHoldForReview] = useState(true)
  const [overlay, setOverlay] = useState<OverlayStyle['id']>('minimal')
  const [volume, setVolume] = useState(70)
  const radioName = useId()
  const volumeId = useId()

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <span className="font-display text-sm font-semibold text-ivory">Creator studio</span>
        <span className="chip">Concept preview · sample data</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)]">
        {/* Module rail — static labels, not navigation */}
        <ul className="hidden border-r border-line p-3 lg:block" aria-label="Studio modules">
          {MODULES.map(({ label, icon: Icon, current }) => (
            <li
              key={label}
              aria-current={current ? 'true' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${current ? 'bg-raised text-ivory' : 'text-mist'}`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-px bg-line xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Settings */}
          <div className="flex flex-col gap-7 bg-graphite p-5 sm:p-6">
            <div>
              <h3 className="eyebrow mb-4">Visual interactions</h3>
              <Switch
                checked={showMedia}
                onChange={setShowMedia}
                label="Show media with alerts"
                hint={showMedia ? 'GIFs and clips appear alongside messages.' : 'Alerts show text only.'}
              />
            </div>

            <fieldset>
              <legend className="eyebrow mb-4">Overlay style</legend>
              <div className="grid grid-cols-3 gap-2">
                {OVERLAY_STYLES.map((o) => (
                  <label
                    key={o.id}
                    className={`cursor-pointer rounded-xl border p-2 transition-colors sm:p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan ${
                      overlay === o.id ? 'border-cyan/60 bg-raised' : 'border-line hover:border-mist/40'
                    }`}
                  >
                    <input type="radio" name={radioName} value={o.id} checked={overlay === o.id} onChange={() => setOverlay(o.id)} className="sr-only" />
                    <StyleThumb id={o.id} />
                    <span className="block text-sm font-medium text-ivory">{o.label}</span>
                    <span className="hidden text-xs text-mist sm:block">{o.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <h3 className="eyebrow mb-4">Audio</h3>
              <div className="flex items-center justify-between gap-4">
                <label htmlFor={volumeId} className="text-[0.95rem] font-medium text-ivory">
                  Alert volume
                </label>
                <output htmlFor={volumeId} className="font-display text-sm font-semibold text-mist tabular-nums">
                  {volume}%
                </output>
              </div>
              <input
                id={volumeId}
                type="range"
                min={0}
                max={100}
                step={5}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-3 h-2 w-full cursor-pointer accent-cyan"
              />
            </div>

            <div>
              <h3 className="eyebrow mb-4">Message review</h3>
              <Switch
                checked={holdForReview}
                onChange={setHoldForReview}
                label="Hold flagged messages"
                hint={holdForReview ? 'Messages with blocked terms wait for you.' : 'Everything goes straight to stream.'}
              />
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line" aria-label="Sample message queue">
                {REVIEW_QUEUE.map((m) => {
                  const held = m.status === 'Held' && holdForReview
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs text-mist">{m.user}</span>
                        <span className="block truncate text-ivory">{m.text}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          held ? 'bg-signal/15 text-signal' : 'bg-teal/25 text-mint'
                        }`}
                      >
                        {held ? 'Held' : 'Shown'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Live preview */}
          <div className="flex flex-col gap-4 bg-obsidian/60 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="eyebrow">Preview</h3>
              <span className={`chip ${showMedia ? 'text-mint' : ''}`} aria-live="polite">
                <span className={`h-1.5 w-1.5 rounded-full ${showMedia ? 'bg-mint' : 'bg-mist/50'}`} aria-hidden="true" />
                Media {showMedia ? 'on' : 'off'}
              </span>
            </div>
            <StreamViewport
              className="border border-line"
              label={`Stream preview with a ${overlay} overlay${showMedia ? ' and media' : ''}`}
            >
              <OverlaySample style={overlay} showMedia={showMedia} />
            </StreamViewport>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-line p-3">
                <dt className="text-mist">Overlay</dt>
                <dd className="font-medium text-ivory capitalize">{overlay}</dd>
              </div>
              <div className="rounded-xl border border-line p-3">
                <dt className="text-mist">Alert volume</dt>
                <dd className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                    <span className="block h-full rounded-full bg-cyan transition-[width] duration-300" style={{ width: `${volume}%` }} />
                  </span>
                  <span className="font-medium text-ivory tabular-nums">{volume}%</span>
                </dd>
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-xl border border-line p-3">
                <dt className="flex items-center gap-2 text-mist">
                  <ShieldCheck aria-hidden="true" className={`h-4 w-4 ${holdForReview ? 'text-mint' : 'text-mist'}`} />
                  Review
                </dt>
                <dd className="ml-auto font-medium text-ivory">{holdForReview ? 'Holding flagged messages' : 'Off'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
