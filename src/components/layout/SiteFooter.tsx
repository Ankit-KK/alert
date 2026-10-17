import { ArrowUpRight } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { NAV_ITEMS, PRODUCT_URL } from '@/content/site'

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line bg-obsidian px-4 pt-16 pb-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12">
        <div className="md:col-span-6">
          <a href="#top" aria-label="HyperChat, back to top" className="inline-block rounded-lg">
            <Logo />
          </a>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-mist">
            HyperChat brings voice, sound, and visual interactions into livestreams — built for creators and the communities that watch them.
          </p>
        </div>
        <nav aria-label="Footer" className="grid gap-8 min-[360px]:grid-cols-2 md:col-span-6 md:justify-items-end">
          <div>
            <h2 className="eyebrow mb-4">On this page</h2>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-10 items-center text-ivory/90 transition-colors hover:text-cyan">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#soundboard" className="inline-flex min-h-10 items-center text-ivory/90 transition-colors hover:text-cyan">
                  Soundboard
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow mb-4">HyperChat</h2>
            <ul className="space-y-1">
              <li>
                <a href={PRODUCT_URL} className="inline-flex min-h-10 items-center gap-1.5 text-ivory/90 transition-colors hover:text-cyan">
                  hyperchat.space
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1440px] flex-col gap-3 border-t border-line pt-6 text-sm text-mist sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} HyperChat. All rights reserved.</p>
        <p>Interactive previews on this page run in your browser and use sample content.</p>
      </div>
    </footer>
  )
}
