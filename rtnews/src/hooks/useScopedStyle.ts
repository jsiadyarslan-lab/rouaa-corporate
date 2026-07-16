import { useEffect, useId } from 'react'

/**
 * useScopedStyle — Safely injects dynamic CSS in Next.js App Router.
 *
 * Simple implementation that injects a <style> tag into the document head
 * with a unique data attribute for cleanup. No external dependencies needed.
 */
export function useScopedStyle(css: string) {
  const id = useId()

  useEffect(() => {
    if (!css || typeof document === 'undefined') return

    const styleId = `scoped-style-${id.replace(/:/g, '')}`
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      styleEl.setAttribute('data-scoped', 'true')
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = css

    return () => {
      const el = document.getElementById(styleId)
      if (el) el.remove()
    }
  }, [css, id])
}
