export async function registerServiceWorker() {
  if (!import.meta.env.PROD || '__TAURI_INTERNALS__' in window ||
      !('serviceWorker' in navigator)) return

  try {
    await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    })
  } catch (error) {
    // Offline support is optional; registration failures must not block the reader.
    console.warn('Could not register the offline service worker.', error)
  }
}
