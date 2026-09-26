import { describe, expect, it, vi } from 'vitest'
import { readPickedFiles } from './readPickedFiles.js'
import { makeFileKey } from './fileKey.js'

describe('readPickedFiles', () => {
  it('reads real File objects and assigns IDs', async () => {
    const file = new File(['# Hello'], 'hello.md', { lastModified: 123 })
    const allocateId = vi.fn(() => 7)

    expect(await readPickedFiles([file], allocateId)).toEqual([{
      id: 7,
      name: 'hello.md',
      key: makeFileKey(file),
      content: '# Hello',
    }])
    expect(allocateId).toHaveBeenCalledOnce()
  })

  it.each([null, []])('returns no files for an empty selection', async (selection) => {
    const allocateId = vi.fn()
    expect(await readPickedFiles(selection, allocateId)).toEqual([])
    expect(allocateId).not.toHaveBeenCalled()
  })

  it('skips a failed read while preserving successful files', async () => {
    const badFile = {
      name: 'bad.md', size: 1, lastModified: 1,
      text: () => Promise.reject(new Error('read failed')),
    }
    const goodFile = new File(['good'], 'good.md', { lastModified: 2 })
    let id = 0

    expect(await readPickedFiles([badFile, goodFile], () => ++id)).toEqual([{
      id: 2,
      name: 'good.md',
      key: makeFileKey(goodFile),
      content: 'good',
    }])
  })
})
