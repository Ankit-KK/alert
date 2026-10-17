/**
 * HyperChat brand lockup, drawn from the official artwork.
 *
 * /public/brand/hyperchat-mark.svg and hyperchat-wordmark.svg are vector
 * traces of the supplied logo files (proportions and gradient preserved);
 * the matching .png files are the untouched originals cropped to their bounds.
 * The logo keeps its own blue → magenta gradient — it is the one place that
 * colour appears on the page.
 */
const MARK_RATIO = 410 / 299
const WORDMARK_RATIO = 1118 / 161

export function LogoMark({ className = '', height = 32 }: { className?: string; height?: number }) {
  return (
    <img
      src="/brand/hyperchat-mark.svg"
      alt=""
      aria-hidden="true"
      width={Math.round(height * MARK_RATIO)}
      height={height}
      className={className}
      draggable={false}
    />
  )
}

export function Wordmark({ className = '', height = 20 }: { className?: string; height?: number }) {
  return (
    <img
      src="/brand/hyperchat-wordmark.svg"
      alt="HyperChat"
      width={Math.round(height * WORDMARK_RATIO)}
      height={height}
      className={className}
      draggable={false}
    />
  )
}

export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const mark = size === 'lg' ? 34 : 26
  const word = size === 'lg' ? 22 : 17
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark height={mark} />
      <Wordmark height={word} />
    </span>
  )
}
