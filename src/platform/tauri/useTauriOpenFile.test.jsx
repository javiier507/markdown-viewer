import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useTauriOpenFile } from './useTauriOpenFile.js'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }))

describe('useTauriOpenFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete window.__TAURI_INTERNALS__
  })

  it('does nothing outside Tauri', () => {
    renderHook(() => useTauriOpenFile(vi.fn()))
    expect(invoke).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })

  it('delivers pending files and events and unsubscribes on unmount', async () => {
    window.__TAURI_INTERNALS__ = {}
    const pending = { path: '/pending.md', name: 'pending.md', content: 'pending' }
    const incoming = { path: '/incoming.md', name: 'incoming.md', content: 'incoming' }
    const onOpenFile = vi.fn()
    const unlisten = vi.fn()
    vi.mocked(invoke).mockResolvedValue(pending)
    vi.mocked(listen).mockResolvedValue(unlisten)

    const { unmount } = renderHook(() => useTauriOpenFile(onOpenFile))
    await waitFor(() => expect(listen).toHaveBeenCalledWith('open-file', expect.any(Function)))
    expect(invoke).toHaveBeenCalledWith('take_pending_file')
    expect(onOpenFile).toHaveBeenCalledWith(pending)

    const eventHandler = vi.mocked(listen).mock.calls[0][1]
    eventHandler({ payload: incoming })
    expect(onOpenFile).toHaveBeenCalledWith(incoming)
    expect(onOpenFile).toHaveBeenCalledTimes(2)

    unmount()
    expect(unlisten).toHaveBeenCalledOnce()
  })
})
