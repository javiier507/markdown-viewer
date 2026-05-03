import { useEffect, useRef } from 'react'

const isTauri = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function useTauriOpenFile(onOpenFile) {
  const handlerRef = useRef(onOpenFile)
  useEffect(() => {
    handlerRef.current = onOpenFile
  })

  useEffect(() => {
    if (!isTauri()) return

    let unlisten
    let cancelled = false

    ;(async () => {
      const [{ listen }, { invoke }] = await Promise.all([
        import('@tauri-apps/api/event'),
        import('@tauri-apps/api/core'),
      ])

      const pending = await invoke('take_pending_file').catch(() => null)
      if (!cancelled && pending) handlerRef.current(pending)

      const off = await listen('open-file', (e) =>
        handlerRef.current(e.payload),
      )
      if (cancelled) off()
      else unlisten = off
    })()

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])
}
