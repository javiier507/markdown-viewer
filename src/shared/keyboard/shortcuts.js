export const SHORTCUTS = {
  toggleSidebar: {
    key: 'b',
    mod: true, // Ctrl on Windows/Linux, Cmd on macOS
    ariaKeyShortcuts: 'Control+b Meta+b',
    label: 'Ctrl/Cmd+B',
  },
  refreshFile: {
    key: 'r',
    mod: true,
    ariaKeyShortcuts: 'Control+r Meta+r',
    label: 'Ctrl/Cmd+R',
  },
}

export function matchesShortcut(event, shortcut) {
  if (event.altKey || event.shiftKey) return false
  if (shortcut.mod && event.ctrlKey === event.metaKey) return false
  if (!shortcut.mod && (event.ctrlKey || event.metaKey)) return false
  return event.key.toLowerCase() === shortcut.key
}
