import { useId } from 'react'

/** Accessible on/off switch with a visible label and optional hint. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block text-[0.95rem] font-medium text-ivory">
          {label}
        </span>
        {hint && (
          <span id={`${id}-hint`} className="block text-sm text-mist">
            {hint}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300 ${
          checked ? 'border-cyan bg-teal' : 'border-line bg-obsidian'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute h-6 w-6 rounded-full shadow transition-transform duration-300 ease-[var(--ease-out-expo)] ${
            checked ? 'translate-x-7 bg-ivory' : 'translate-x-1 bg-mist'
          }`}
        />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  )
}
