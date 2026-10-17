/**
 * HyperChat brand lockup.
 *
 * NOTE: the official logo file was not available to this build, so the mark
 * below is a self-authored stand-in (chat bubble + "H" built from audio bars
 * and a live dot). To use the official asset, replace `LogoMark` with an
 * <img src="/brand/<official-file>"> at the same size — every placement on
 * the page goes through this component. /public/brand/hyperchat-mark.svg and
 * /public/favicon.svg mirror this mark and should be swapped at the same time.
 */
export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14 4h20a10 10 0 0 1 10 10v12a10 10 0 0 1-10 10H19.5L11 43.2V35.4A10 10 0 0 1 4 26V14A10 10 0 0 1 14 4Z"
        fill="#F3F1E9"
      />
      <rect x="14.5" y="12" width="4.5" height="16" rx="2.25" fill="#080C0F" />
      <rect x="29" y="12" width="4.5" height="16" rx="2.25" fill="#080C0F" />
      <path d="M19 20.5c1.7-3.2 3.3-3.2 5 0s3.3 3.2 5 0" stroke="#0B838C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="8" r="5" fill="#FF7048" stroke="#080C0F" strokeWidth="2.5" />
    </svg>
  )
}

export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} />
      <span className={`font-display font-bold tracking-[-0.03em] text-ivory ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>HyperChat</span>
    </span>
  )
}
