import { useCallback, useEffect, useState } from 'react'

const isInstallable = () =>
  !('__TAURI_INTERNALS__' in window) &&
  !window.matchMedia?.('(display-mode: standalone)').matches

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null)

  useEffect(() => {
    if (!isInstallable()) return undefined

    const handleBeforeInstallPrompt = (event) => {
      // Keep the event so the browser's mini-infobar gives way to our own button.
      event.preventDefault()
      setPromptEvent(event)
    }
    const handleAppInstalled = () => setPromptEvent(null)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return
    // A deferred prompt can only be shown once, whatever the user answers.
    setPromptEvent(null)
    try {
      await promptEvent.prompt()
      await promptEvent.userChoice
    } catch (error) {
      console.warn('Could not show the install prompt.', error)
    }
  }, [promptEvent])

  return { canInstall: promptEvent !== null, install }
}
