import { useEffect } from 'react'
import { useResumeStore } from '../stores/resumeStore'

/** Reflects the persisted theme onto <html data-theme=...> after hydration. */
export function ThemeBridge() {
  const theme = useResumeStore((s) => s.theme)
  const hydrated = useResumeStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!hydrated) return
    document.documentElement.dataset.theme = theme
  }, [theme, hydrated])

  return null
}
