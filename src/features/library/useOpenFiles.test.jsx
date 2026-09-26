import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOpenFiles } from './useOpenFiles.js'

const makeFile = (name, content = name) =>
  new File([content], name, { lastModified: 123 })

describe('useOpenFiles', () => {
  it('opens multiple native paths and selects the first, including existing files', () => {
    const { result } = renderHook(useOpenFiles)
    const first = { path: '/first.md', name: 'first.md', content: 'first' }
    const second = { path: '/second.md', name: 'second.md', content: 'second' }

    act(() => result.current.addFilesFromPaths([first, second]))
    expect(result.current.files).toHaveLength(2)
    expect(result.current.activeFile.name).toBe('first.md')

    act(() => result.current.addFilesFromPaths([second, first]))
    expect(result.current.files).toHaveLength(2)
    expect(result.current.activeFile.name).toBe('second.md')
  })
  it('reactivates an existing browser file instead of duplicating it', async () => {
    const { result } = renderHook(useOpenFiles)
    const first = makeFile('first.md')
    const second = makeFile('second.md')

    await act(async () => result.current.addFiles([first, second]))
    const firstId = result.current.files[0].id
    act(() => result.current.selectFile(result.current.files[1].id))
    await act(async () => result.current.addFiles([first]))

    expect(result.current.files).toHaveLength(2)
    expect(result.current.activeId).toBe(firstId)
  })

  it('deduplicates overlapping reads of the same file', async () => {
    const { result } = renderHook(useOpenFiles)
    const file = makeFile('shared.md')

    await act(async () => {
      await Promise.all([
        result.current.addFiles([file]),
        result.current.addFiles([file]),
      ])
    })

    expect(result.current.files).toHaveLength(1)
  })

  it('activates the first picked file in a batch', async () => {
    const { result } = renderHook(useOpenFiles)
    await act(async () => result.current.addFiles([
      makeFile('first.md'), makeFile('second.md'),
    ]))

    expect(result.current.activeFile.name).toBe('first.md')
  })

  it('deduplicates Tauri files by path and reactivates them', () => {
    const { result } = renderHook(useOpenFiles)
    act(() => result.current.addFileFromPath({ path: '/one.md', name: 'one.md', content: 'one' }))
    const firstId = result.current.activeId
    act(() => result.current.addFileFromPath({ path: '/two.md', name: 'two.md', content: 'two' }))
    act(() => result.current.addFileFromPath({ path: '/one.md', name: 'one.md', content: 'changed' }))

    expect(result.current.files).toHaveLength(2)
    expect(result.current.activeId).toBe(firstId)
    expect(result.current.activeFile.content).toBe('one')
  })

  it('keeps the active file when removing another and clears it when removing the active file', () => {
    const { result } = renderHook(useOpenFiles)
    act(() => result.current.addFileFromPath({ path: '/one.md', name: 'one.md', content: 'one' }))
    const firstId = result.current.activeId
    act(() => result.current.addFileFromPath({ path: '/two.md', name: 'two.md', content: 'two' }))
    const secondId = result.current.activeId

    act(() => result.current.removeFile(firstId))
    expect(result.current.activeId).toBe(secondId)
    expect(result.current.files).toHaveLength(1)

    act(() => result.current.removeFile(secondId))
    expect(result.current.files).toHaveLength(0)
    expect(result.current.activeId).toBeNull()
    expect(result.current.activeFile).toBeNull()
  })

  it('selects another open file', () => {
    const { result } = renderHook(useOpenFiles)
    act(() => result.current.addFileFromPath({ path: '/one.md', name: 'one.md', content: 'one' }))
    const firstId = result.current.activeId
    act(() => result.current.addFileFromPath({ path: '/two.md', name: 'two.md', content: 'two' }))
    act(() => result.current.selectFile(firstId))

    expect(result.current.activeId).toBe(firstId)
    expect(result.current.activeFile.name).toBe('one.md')
  })
})
