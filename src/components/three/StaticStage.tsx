import { useEffect, useState, type ReactNode } from 'react'
import { AudioLines, Film, MessageSquare, Volume2 } from 'lucide-react'
import { LiveBadge, StreamFrameImage } from '@/components/interactive/StreamViewport'

// Loudness envelope for the voice-message card's waveform.
const WAVE = [0.35, 0.6, 0.9, 0.55, 1, 0.7, 0.85, 0.45, 0.65, 0.95, 0.5, 0.35]

/** A floating interaction card: sender, kind of interaction, and its content. */
function Card({
  className,
  initials,
  avatar,
  name,
  icon: Icon,
  accent,
  children,
  trailing,
}: {
  className: string
  initials: string
  avatar: string
  name: string
  icon: typeof AudioLines
  accent: string
  children: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div
      className={`absolute w-max items-center gap-2.5 rounded-xl border border-line bg-graphite/95 py-2 pr-3 pl-2 shadow-[0_24px_48px_-18px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.05)] sm:gap-3 sm:py-2.5 sm:pr-3.5 sm:pl-2.5 max-md:[@media(max-height:760px)]:hidden ${className}`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-[11px] font-bold tracking-tight text-obsidian sm:h-9 sm:w-9 sm:text-xs ${avatar}`}
      >
        {initials}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-display text-xs leading-tight font-semibold text-mist">
          {name}
          <Icon className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] leading-tight font-medium whitespace-nowrap text-ivory sm:text-sm">
          {children}
        </span>
      </span>
      {trailing}
    </div>
  )
}

/** Whether the section with this id overlaps the (inset) viewport. */
function useSectionInView(id: string, rootMargin: string, initial: boolean) {
  const [inView, setInView] = useState(initial)
  useEffect(() => {
    const el = document.getElementById(id)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [id, rootMargin])
  return inView
}

/**
 * Lightweight, non-WebGL rendition of the Interaction Engine. Shown while the
 * 3D chunk loads, and permanently when WebGL is unavailable or disabled.
 * HTML + CSS over the sample broadcast still; decorative only.
 */
export function StaticStage({ visible }: { visible: boolean }) {
  // The brand moment has its own flat mark and full-width type; step aside
  // while it is on screen instead of competing with it.
  const brandSolo = useSectionInView('story', '-10% 0px -10% 0px', false)
  // The text cards belong to the hero. Once it scrolls away the stage sits
  // behind other sections' content, so they bow out and only the ambient art stays.
  const heroInView = useSectionInView('top', '-40% 0px 0px 0px', true)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000"
      style={{ opacity: visible && !brandSolo ? 1 : 0 }}
    >
      <div className="absolute top-[8%] left-1/2 aspect-[4/3] w-full max-w-[36rem] -translate-x-1/2 max-md:[@media(max-height:760px)]:opacity-30 sm:top-[9%] sm:w-[70%] md:top-[30%] md:right-[2%] md:left-auto md:w-[46%] md:max-w-none md:translate-x-0 lg:top-1/2 lg:right-0 lg:w-[48%] lg:-translate-y-1/2 xl:w-[47%]">
        {/* Ambient light */}
        <div className="absolute inset-[-12%] bg-[radial-gradient(46%_40%_at_50%_48%,rgba(11,131,140,0.3),rgba(11,131,140,0)_72%)]" />

        {/* Stream display, angled toward the headline */}
        <div className="absolute top-[3%] left-[12%] w-[76%] [perspective:1600px] sm:left-[16%] sm:w-[68%]">
          <div className="rounded-[1.1rem] border border-line bg-raised p-[1.6%] shadow-[0_60px_100px_-40px_rgba(0,0,0,0.95),0_0_90px_-30px_rgba(56,221,232,0.4)] [transform:rotateY(-12deg)_rotateX(5deg)]">
            <div className="relative aspect-video overflow-hidden rounded-[0.75rem] bg-obsidian">
              <StreamFrameImage eager />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,15,0.45)_0%,rgba(8,12,15,0)_26%,rgba(8,12,15,0)_60%,rgba(8,12,15,0.55)_100%)]" />
              <LiveBadge className="absolute top-[6%] left-[4%]" />
            </div>
          </div>
        </div>

        {/* Brand mark on a lit pedestal, in front of the display */}
        <div className="absolute top-[65%] left-1/2 w-[32%] -translate-x-1/2 sm:top-[61%] sm:w-[40%]">
          <div className="absolute top-[-30%] left-1/2 aspect-square w-[82%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(56,221,232,0.26),rgba(56,221,232,0))]" />
          <div className="absolute bottom-[8%] left-1/2 h-[150%] w-[44%] -translate-x-1/2 bg-[linear-gradient(0deg,rgba(56,221,232,0.16),rgba(56,221,232,0))] [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
          <svg viewBox="0 0 400 140" className="absolute top-[34%] left-[-25%] w-[150%]" fill="none">
            <defs>
              <radialGradient id="hc-static-floor" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38DDE8" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#0B838C" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#0B838C" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="200" cy="70" rx="196" ry="62" fill="url(#hc-static-floor)" />
            <ellipse cx="200" cy="66" rx="176" ry="44" stroke="#38DDE8" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="2 10" strokeLinecap="round" />
            <ellipse cx="200" cy="66" rx="130" ry="31" stroke="#38DDE8" strokeOpacity="0.6" strokeWidth="2" />
            <ellipse cx="200" cy="66" rx="98" ry="22" stroke="#F3F1E9" strokeOpacity="0.3" strokeWidth="1.5" />
          </svg>
          <img
            src="/brand/hyperchat-mark.svg"
            alt=""
            width={410}
            height={299}
            decoding="async"
            draggable={false}
            className="relative mx-auto w-[48%] drop-shadow-[0_14px_28px_rgba(8,12,15,0.8)]"
          />
        </div>

        {/* Interactions arriving */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${heroInView ? 'opacity-100' : 'opacity-0'}`}>
          <Card
            className="flex top-[8%] right-[3%] sm:top-[-2%] sm:right-[4%] motion-safe:animate-[hc-drift_8s_ease-in-out_-3s_infinite_alternate]"
            initials="NF"
            avatar="bg-[linear-gradient(140deg,#F3F1E9,#B6E8D8)]"
            name="nova_frames"
            icon={MessageSquare}
            accent="text-mint"
          >
            that clutch was unreal
          </Card>

          <Card
            className="flex top-[42%] left-[3%] sm:top-[24%] sm:left-[2%] md:hidden lg:flex motion-safe:animate-[hc-drift_7s_ease-in-out_infinite_alternate]"
            initials="KC"
            avatar="bg-cyan"
            name="kitecat"
            icon={AudioLines}
            accent="text-cyan"
            trailing={
              <span className="ml-1 hidden h-6 items-center gap-[2px] xl:flex">
                {WAVE.map((h, i) => (
                  <span key={i} className={`w-[3px] rounded-full ${i < 6 ? 'bg-cyan' : 'bg-cyan/40'}`} style={{ height: `${Math.round(h * 100)}%` }} />
                ))}
              </span>
            }
          >
            voice message <span className="font-display text-mist tabular-nums">· 0:04</span>
          </Card>

          <Card
            className="hidden top-[37%] right-[3%] sm:flex motion-safe:animate-[hc-drift_9s_ease-in-out_-5s_infinite_alternate]"
            initials="LL"
            avatar="bg-[linear-gradient(140deg,#FFA284,#FF7048)]"
            name="lowpoly_lu"
            icon={Volume2}
            accent="text-signal"
          >
            played
            <span className="rounded-md bg-signal px-1.5 py-[3px] font-display text-[11px] leading-none font-bold tracking-[0.08em] text-obsidian shadow-[inset_0_-2px_0_rgba(8,12,15,0.25)]">
              HYPE
            </span>
          </Card>

          <Card
            className="hidden top-[74%] left-[1%] xl:flex motion-safe:animate-[hc-drift_8.5s_ease-in-out_-1.5s_infinite_alternate]"
            initials="OJ"
            avatar="bg-[linear-gradient(140deg,#B6E8D8,#38DDE8)]"
            name="orbit.jay"
            icon={Film}
            accent="text-mint"
            trailing={
              <span className="relative ml-1 h-10 w-14 shrink-0 overflow-hidden rounded-md bg-obsidian ring-1 ring-ivory/15">
                <img
                  src="/media/clip-boost.webp"
                  alt=""
                  width={720}
                  height={720}
                  decoding="async"
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover object-[50%_62%]"
                />
              </span>
            }
          >
            sent a clip
          </Card>
        </div>
      </div>
    </div>
  )
}
