import { describe, expect, it } from 'vitest'
import { SHORTCUTS, matchesShortcut } from './shortcuts.js'

const press = (options) => ({
  key: 'b', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...options,
})

describe('matchesShortcut', () => {
  const shortcut = SHORTCUTS.toggleSidebar

  it('matches Ctrl+B and Cmd+B regardless of letter case', () => {
    expect(matchesShortcut(press({ ctrlKey: true }), shortcut)).toBe(true)
    expect(matchesShortcut(press({ metaKey: true }), shortcut)).toBe(true)
    expect(matchesShortcut(press({ ctrlKey: true, key: 'B' }), shortcut)).toBe(true)
  })

  it('rejects other keys, missing or extra modifiers', () => {
    expect(matchesShortcut(press({}), shortcut)).toBe(false)
    expect(matchesShortcut(press({ ctrlKey: true, key: 'a' }), shortcut)).toBe(false)
    expect(matchesShortcut(press({ ctrlKey: true, metaKey: true }), shortcut)).toBe(false)
    expect(matchesShortcut(press({ ctrlKey: true, altKey: true }), shortcut)).toBe(false)
    expect(matchesShortcut(press({ metaKey: true, shiftKey: true }), shortcut)).toBe(false)
  })

  it('matches Ctrl+R and Cmd+R for refreshing a file', () => {
    const refresh = SHORTCUTS.refreshFile
    expect(matchesShortcut(press({ key: 'r', ctrlKey: true }), refresh)).toBe(true)
    expect(matchesShortcut(press({ key: 'R', metaKey: true }), refresh)).toBe(true)
    expect(matchesShortcut(press({ key: 'r', ctrlKey: true, shiftKey: true }), refresh)).toBe(false)
    expect(matchesShortcut(press({ key: 'r', ctrlKey: true, altKey: true }), refresh)).toBe(false)
    expect(matchesShortcut(press({ key: 'b', ctrlKey: true }), refresh)).toBe(false)
  })
})
