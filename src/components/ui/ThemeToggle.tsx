import { Moon, Palette, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { useResumeStore } from '../../stores/resumeStore'
import { cn } from '#/lib/utils'
import type { Theme } from '../../stores/types'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const themes: Array<{ value: Theme; label: string; icon: ReactNode }> = [
  { value: 'dark', label: 'Dark', icon: <Moon /> },
  { value: 'light', label: 'Light', icon: <Sun /> },
  { value: 'riso', label: 'Riso', icon: <Palette /> },
]

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useResumeStore((s) => s.theme)
  const setTheme = useResumeStore((s) => s.setTheme)

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(next) => {
        if (next) setTheme(next as Theme)
      }}
      aria-label="Theme"
      variant="outline"
      size="sm"
      spacing={0}
      className={cn(
        'rounded-lg border border-border bg-card p-0.5',
        className,
      )}
    >
      {themes.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            aria-label={`${item.label} theme`}
            className={cn(
              'gap-1.5 text-[11.5px]',
              item.value === theme ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
            )}
          >
            <span data-icon="inline-start">{item.icon}</span>
            <span>{item.label}</span>
          </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
