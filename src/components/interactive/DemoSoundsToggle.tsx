import { useId } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useSoundMuted } from '@/lib/audio/useSoundMuted'

/**
 * The page's single on/off control for demo sounds: the soundboard pads and
 * the visuals alert chime. Both sections render this same toggle, so it keeps
 * one stable name with aria-pressed, shows its state as a word, and describes
 * its scope. Voice samples ignore it; they only ever play on an explicit press.
 */
export function DemoSoundsToggle() {
  const [muted, toggle] = useSoundMuted()
  const hintId = useId()
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!muted}
        aria-describedby={hintId}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line py-1 pr-1.5 pl-3.5 text-sm font-medium text-mist transition-colors hover:border-mist/50 hover:text-ivory"
      >
        {muted ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
        Demo sounds
        <span
          aria-hidden="true"
          className={`min-w-[2.6rem] rounded-full px-2 py-1 text-center font-display text-[0.6875rem] leading-none font-bold tracking-[0.08em] uppercase transition-colors ${
            muted ? 'bg-raised text-mist' : 'bg-cyan/15 text-cyan'
          }`}
        >
          {muted ? 'Off' : 'On'}
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Switches the soundboard pads and the alert chime on or off. Voice samples still play when you press play.
      </span>
    </>
  )
}
