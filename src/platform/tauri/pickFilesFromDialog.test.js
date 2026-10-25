import { beforeEach, describe, expect, it, vi } from 'vitest'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { pickFilesFromDialog } from './pickFilesFromDialog.js'

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))

const payload = { path: '/a.md', name: 'a.md', content: '# A' }

describe('pickFilesFromDialog', () => {
  beforeEach(() => {
    open.mockReset()
    invoke.mockReset()
  })

  it('returns no files when the dialog is cancelled', async () => {
    open.mockResolvedValue(null)
    expect(await pickFilesFromDialog()).toEqual([])
    expect(invoke).not.toHaveBeenCalled()
  })

  it('reads the selected paths natively', async () => {
    open.mockResolvedValue(['/a.md', '/b.md'])
    invoke.mockResolvedValue([payload])
    expect(await pickFilesFromDialog()).toEqual([payload])
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ multiple: true, directory: false }))
    expect(invoke).toHaveBeenCalledWith('read_dropped_files', { paths: ['/a.md', '/b.md'] })
  })

  it('accepts a single selected path', async () => {
    open.mockResolvedValue('/a.md')
    invoke.mockResolvedValue([payload])
    await pickFilesFromDialog()
    expect(invoke).toHaveBeenCalledWith('read_dropped_files', { paths: ['/a.md'] })
  })

  it('returns no files when the dialog fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    open.mockRejectedValue(new Error('denied'))
    expect(await pickFilesFromDialog()).toEqual([])
  })
})
