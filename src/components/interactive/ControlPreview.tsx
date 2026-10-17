import { useId, useState } from 'react'
import { AudioLines, Image, LayoutTemplate, ListChecks, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { OVERLAY_STYLES, REVIEW_QUEUE, type OverlayStyle } from '@/content/site'
import { StreamViewport } from './StreamViewport'
import { Switch } from './Switch'

const MODULES = [
  { label: 'Interactions', icon: SlidersHorizontal },
  { label: 'Audio', icon: AudioLines },
  { label: 'Soundboard', icon: ListChecks },
  { label: 'Overlay', icon: LayoutTemplate, current: true },
  { label: 'Message review', icon: ShieldCheck },
]

function OverlaySample({ style, showMedia }: { style: OverlayStyle['id']; showMedia: boolean }) {
  const media = showMedia ? (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-md bg-ivory" style={{ width: '2.4em', height: '2.4em' }}>
      <Image aria-hidden="true" className="h-[1.2em] w-[1.2em] text-obsidian" />
    </span>
  ) : null

  if (style === 'ticker') {
    return (
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t-2 border-cyan bg-obsidian/92 px-4 py-2 text-[clamp(0.6rem,1.4vw,0.85rem)]">
        {media}
        <span className="font-display font-bold tracking-[0.06em] text-cyan">VOICE</span>
        <span className="truncate text-ivory">kitecat: “Run it back one more time!”</span>
      </div>
    )
  }
  if (style === 'spotlight') {
    return (
      <div className="absolute inset-0 grid place-items-center bg-obsidian/40">
        <div className="flex max-w-[70%] flex-col items-center gap-2 rounded-2xl border-2 border-cyan bg-obsidian/92 px-5 py-4 text-center text-[clamp(0.65rem,1.5vw,0.95rem)]">
          {media}
          <span className="font-display font-bold tracking-[0.06em] text-cyan">VOICE MESSAGE</span>
          <span className="text-ivory">kitecat: “Run it back one more time!”</span>
        </div>
      </div>
    )
  }
  return (
    <div className="absolute top-[6%] right-[4%] flex max-w-[52%] items-center gap-2.5 rounded-xl border-2 border-cyan bg-obsidian/92 px-3 py-2 text-[clamp(0.6rem,1.3vw,0.85rem)]">
      {media}
      <span className="min-w-0">
        <span className="block font-display font-bold tracking-[0.06em] text-cyan">VOICE</span>
        <span className="block truncate text-ivory">kitecat: “Run it back…”</span>
      </span>
    </div>
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
                    className={`cursor-pointer rounded-xl border p-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan ${
                      overlay === o.id ? 'border-cyan/60 bg-raised' : 'border-line hover:border-mist/40'
                    }`}
                  >
                    <input type="radio" name={radioName} value={o.id} checked={overlay === o.id} onChange={() => setOverlay(o.id)} className="sr-only" />
                    <span aria-hidden="true" className="relative mb-2.5 block aspect-video rounded-md bg-obsidian">
                      {o.id === 'minimal' && <span className="absolute top-1 right-1 h-2 w-5 rounded-sm bg-cyan" />}
                      {o.id === 'spotlight' && <span className="absolute inset-x-[25%] top-[30%] h-[40%] rounded-sm bg-cyan" />}
                      {o.id === 'ticker' && <span className="absolute inset-x-0 bottom-0 h-1.5 rounded-b-md bg-cyan" />}
                    </span>
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
