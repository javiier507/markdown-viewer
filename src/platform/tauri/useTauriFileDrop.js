import { useEffect, useRef, useState } from 'react'
import { isSupportedFile } from '../../features/library/supportedFiles.js'

export function useTauriFileDrop(onFiles) {
  const [isDragging, setIsDragging] = useState(false)
  const handlerRef = useRef(onFiles)
  useEffect(() => { handlerRef.current = onFiles })

  useEffect(() => {
    if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return

    let cancelled = false
    let unlisten
    ;(async () => {
      const [{ getCurrentWebview }, { invoke }] = await Promise.all([
        import('@tauri-apps/api/webview'),
        import('@tauri-apps/api/core'),
      ])
      const off = await getCurrentWebview().onDragDropEvent(async ({ payload }) => {
        if (cancelled) return
        if (payload.type === 'enter') {
          setIsDragging(payload.paths.some(isSupportedFile))
        } else if (payload.type === 'leave') {
          setIsDragging(false)
        } else if (payload.type === 'drop') {
          setIsDragging(false)
          const paths = payload.paths.filter(isSupportedFile)
          if (paths.length === 0) return
          try {
            const files = await invoke('read_dropped_files', { paths })
            if (!cancelled) handlerRef.current(files)
          } catch (error) {
            console.warn('read_dropped_files failed:', error)
          }
        }
      })
      if (cancelled) off()
      else unlisten = off
    })().catch((error) => console.warn('file drop listener failed:', error))

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  return isDragging
}
