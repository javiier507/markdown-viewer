import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInstallPrompt } from './useInstallPrompt.js'

function createPromptEvent(outcome = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome })
  return event
}

describe('useInstallPrompt', () => {
  afterEach(() => {
    delete window.__TAURI_INTERNALS__
  })

  it('stays unavailable until the browser offers an install prompt', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it('captures the prompt, shows it once and clears it', async () => {
    const { result } = renderHook(() => useInstallPrompt())
    const event = createPromptEvent()

    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(result.current.canInstall).toBe(true)

    await act(async () => {
      await result.current.install()
    })
    expect(event.prompt).toHaveBeenCalledOnce()
    expect(result.current.canInstall).toBe(false)
  })

  it('clears the prompt when the app gets installed', () => {
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      window.dispatchEvent(createPromptEvent())
    })
    expect(result.current.canInstall).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(result.current.canInstall).toBe(false)
  })

  it('does not listen after unmount', () => {
    const { result, unmount } = renderHook(() => useInstallPrompt())
    unmount()
    const event = createPromptEvent()
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(result.current.canInstall).toBe(false)
  })

  it('is inert inside Tauri', () => {
    window.__TAURI_INTERNALS__ = {}
    const { result } = renderHook(() => useInstallPrompt())
    const event = createPromptEvent()
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(false)
    expect(result.current.canInstall).toBe(false)
  })

  it('is inert when the app already runs as an installed app', () => {
    vi.stubGlobal('matchMedia', vi.fn((query) => ({ matches: query === '(display-mode: standalone)' })))
    const { result } = renderHook(() => useInstallPrompt())
    act(() => {
      window.dispatchEvent(createPromptEvent())
    })
    expect(result.current.canInstall).toBe(false)
  })
})
