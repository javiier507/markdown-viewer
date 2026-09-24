import { describe, expect, it } from 'vitest'
import { makeFileKey, makePathKey } from './fileKey.js'

describe('file keys', () => {
  it('keeps the same browser file identity stable', () => {
    const file = { name: 'notes.md', size: 42, lastModified: 123 }
    expect(makeFileKey(file)).toBe(makeFileKey({ ...file }))
  })

  it.each(['name', 'size', 'lastModified'])('changes when %s changes', (field) => {
    const file = { name: 'notes.md', size: 42, lastModified: 123 }
    const changed = { ...file, [field]: `${file[field]}-different` }
    expect(makeFileKey(changed)).not.toBe(makeFileKey(file))
  })

  it('keeps browser and Tauri keys in separate namespaces', () => {
    const browserFile = { name: 'path', size: 1, lastModified: 2 }
    expect(makePathKey('1::2')).toBe('path::1::2')
    expect(makePathKey('1::2')).not.toBe(makeFileKey(browserFile))
  })
})
