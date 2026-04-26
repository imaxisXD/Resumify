import { useEffect } from 'react'
import { useResumeStore } from '../stores/resumeStore'

/** Reflects the persisted theme onto <html data-theme=...> after hydration,
 *  and applies the user's custom resume ink override on top. */
export function ThemeBridge() {
  const theme = useResumeStore((s) => s.theme)
  const inkOverride = useResumeStore((s) => s.resumeInkOverride)
  const hydrated = useResumeStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!hydrated) return
    document.documentElement.dataset.theme = theme
    if (inkOverride) {
      document.documentElement.style.setProperty('--paper-ink', inkOverride)
    } else {
      document.documentElement.style.removeProperty('--paper-ink')
    }
  }, [theme, inkOverride, hydrated])

  return null
}
