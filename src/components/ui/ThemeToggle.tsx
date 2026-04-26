import { Moon, Palette, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useResumeStore } from '../../stores/resumeStore'
import { cn } from '../../lib/cn'
import type { Theme } from '../../stores/types'

const themes: Array<{ value: Theme; label: string; icon: ReactNode }> = [
  { value: 'dark', label: 'Dark', icon: <Moon size={11} /> },
  { value: 'light', label: 'Light', icon: <Sun size={11} /> },
  { value: 'riso', label: 'Riso', icon: <Palette size={11} /> },
]

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useResumeStore((s) => s.theme)
  const setTheme = useResumeStore((s) => s.setTheme)

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn(
        'inline-flex h-8 items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5',
        className,
      )}
    >
      {themes.map((item) => {
        const active = item.value === theme
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            aria-pressed={active}
            aria-label={`${item.label} theme`}
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center gap-1.5 rounded-md px-1.5 text-[11.5px] font-medium transition-[background,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] active:duration-100',
              active
                ? 'bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-faint)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
