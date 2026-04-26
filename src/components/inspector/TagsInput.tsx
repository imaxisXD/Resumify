import { X } from 'lucide-react'
import { useState } from 'react'

export function commitTagValue(value: Array<string>, draft: string): Array<string> {
  const tag = draft.trim()
  if (!tag || value.includes(tag)) return value
  return [...value, tag]
}

export function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: Array<string>
  onChange: (next: Array<string>) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  const commit = () => {
    const next = commitTagValue(value, draft)
    if (next !== value) {
      onChange(next)
      setDraft('')
    }
  }

  return (
    <div className="mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_4px_var(--accent-glow)] transition-[border,box-shadow]">
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[11.5px] text-[var(--text)]"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="text-[var(--text-faint)] hover:text-[var(--danger)]"
            aria-label={`Remove ${tag}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && draft === '' && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder ?? 'Add tag, press Enter…' : ''}
        className="flex-1 min-w-[80px] h-6 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-faint)]"
      />
    </div>
  )
}
