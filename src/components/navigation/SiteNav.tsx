import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { NAV_ITEMS, PRODUCT_URL, type SectionId } from '@/content/site'
import { useSmoothScroll } from '@/lib/motion/SmoothScroll'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Which nav item a section belongs to, for the active indicator. */
const SECTION_TO_NAV: Partial<Record<SectionId, string>> = {
  features: '#features',
  experience: '#experience',
  soundboard: '#experience',
  visuals: '#experience',
  control: '#experience',
  'how-it-works': '#how-it-works',
}

export function SiteNav({ active }: { active: SectionId }) {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const { lock, unlock } = useSmoothScroll()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }, [])

  // Mobile menu: lock scroll, trap focus, close on Escape or desktop resize.
  useEffect(() => {
    if (!open) return
    lock()
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [toggleRef.current, ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))].filter(Boolean) as HTMLElement[]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    const mql = window.matchMedia('(min-width: 768px)')
    const onWide = () => mql.matches && close(false)

    document.addEventListener('keydown', onKey)
    mql.addEventListener('change', onWide)
    return () => {
      document.removeEventListener('keydown', onKey)
      mql.removeEventListener('change', onWide)
      unlock()
    }
  }, [open, lock, unlock, close])

  const activeHref = SECTION_TO_NAV[active]

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <a href="#main" className="sr-only-focusable btn btn-primary absolute top-3 left-3 z-10">
        Skip to content
      </a>
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between px-4 transition-[padding] duration-500 sm:px-6 lg:px-10 ${
          compact ? 'py-2.5' : 'py-4 sm:py-5'
        }`}
      >
        <a href="#top" className="relative z-10 shrink-0 rounded-lg" aria-label="HyperChat home">
          <Logo />
        </a>

        <nav
          aria-label="Primary"
          className={`hidden items-center gap-1 rounded-full border px-2 py-1.5 transition-colors duration-500 md:flex ${
            compact ? 'border-line bg-graphite/85 backdrop-blur-md' : 'border-transparent bg-transparent'
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeHref === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'true' : undefined}
                className={`relative rounded-full px-4 py-2 font-display text-[0.9375rem] font-medium transition-colors ${
                  isActive ? 'text-ivory' : 'text-mist hover:text-ivory'
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-4 -bottom-0.5 h-px origin-left bg-cyan transition-transform duration-500 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                />
              </a>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a href={PRODUCT_URL} className="btn btn-primary hidden min-h-11 md:inline-flex">
            Get Started
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <button
            ref={toggleRef}
            type="button"
            className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-graphite/80 text-ivory backdrop-blur-md md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => (open ? close() : setOpen(true))}
          >
            {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-0 bg-obsidian/97 px-6 pt-24 pb-10 backdrop-blur-xl md:hidden"
      >
        <nav aria-label="Mobile" className="flex h-full flex-col">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item, i) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => {
                    unlock()
                    close(false)
                  }}
                  className="flex items-baseline gap-4 border-b border-line py-5 font-display text-3xl font-semibold tracking-tight text-ivory"
                >
                  <span className="font-sans text-sm font-medium text-mist">0{i + 1}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={PRODUCT_URL} className="btn btn-primary mt-auto w-full" onClick={() => close(false)}>
            Get Started
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  )
}
