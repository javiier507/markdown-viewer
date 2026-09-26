import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { useTauriFileDrop } from './useTauriFileDrop.js'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: vi.fn(),
}))

describe('useTauriFileDrop', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => { delete window.__TAURI_INTERNALS__ })

  it('does nothing in a browser', () => {
    renderHook(() => useTauriFileDrop(vi.fn()))
    expect(getCurrentWebview).not.toHaveBeenCalled()
  })

  it('reads supported native paths, shows drop state and unsubscribes', async () => {
    window.__TAURI_INTERNALS__ = {}
    const unlisten = vi.fn()
    const onDragDropEvent = vi.fn().mockResolvedValue(unlisten)
    vi.mocked(getCurrentWebview).mockReturnValue({ onDragDropEvent })
    const file = { path: '/test.md', name: 'test.md', content: '# Test' }
    vi.mocked(invoke).mockResolvedValue([file])
    const onFiles = vi.fn()
    const { result, unmount } = renderHook(() => useTauriFileDrop(onFiles))

    await waitFor(() => expect(onDragDropEvent).toHaveBeenCalledOnce())
    const handler = onDragDropEvent.mock.calls[0][0]
    await act(async () => handler({ payload: { type: 'enter', paths: ['/test.md'] } }))
    expect(result.current).toBe(true)
    await act(async () => handler({ payload: { type: 'drop', paths: ['/test.md', '/photo.png'] } }))
    expect(invoke).toHaveBeenCalledWith('read_dropped_files', { paths: ['/test.md'] })
    expect(onFiles).toHaveBeenCalledWith([file])
    expect(result.current).toBe(false)

    unmount()
    expect(unlisten).toHaveBeenCalledOnce()
  })
})
