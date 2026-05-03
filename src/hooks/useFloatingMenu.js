import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const MENU_WIDTH = 148

function getMenuPos(triggerEl, menuHeight) {
  const rect = triggerEl.getBoundingClientRect()
  const top = rect.bottom + 4 + menuHeight > window.innerHeight
    ? rect.top - menuHeight - 4
    : rect.bottom + 4
  const left = rect.left + MENU_WIDTH > window.innerWidth
    ? window.innerWidth - MENU_WIDTH - 8
    : rect.left
  return { top, left }
}

/**
 * Manages a floating portal menu: open state, position (with viewport-overflow
 * guard), repositioning on scroll/resize, outside-click to close, and focus
 * management (moves focus into the first menuitem on open, returns it to the
 * trigger on Escape).
 *
 * @returns {{ isOpen, menuPos, triggerRef, menuRef, openMenu, closeMenu, handleMenuKeyDown }}
 */
export function useFloatingMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const reposition = useCallback(() => {
    if (triggerRef.current && menuRef.current)
      setMenuPos(getMenuPos(triggerRef.current, menuRef.current.offsetHeight))
  }, [])

  // Reposition after the menu renders so we use its actual height
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current && menuRef.current)
      setMenuPos(getMenuPos(triggerRef.current, menuRef.current.offsetHeight))
  }, [isOpen])

  // Close on outside click; reposition on resize/scroll
  useEffect(() => {
    if (!isOpen) return
    function handleClose(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClose)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      document.removeEventListener('mousedown', handleClose)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen, reposition])

  // Move focus into the first menuitem when the menu opens
  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => {
      menuRef.current?.querySelector('[role="menuitem"]')?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  function openMenu(e) {
    e.stopPropagation()
    if (!triggerRef.current) return
    setIsOpen((o) => !o)
  }

  function closeMenu() {
    setIsOpen(false)
  }

  function handleMenuKeyDown(e) {
    if (e.key === 'Escape') {
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')]
      const idx = items.indexOf(document.activeElement)
      const next = e.key === 'ArrowDown'
        ? (idx + 1) % items.length
        : (idx - 1 + items.length) % items.length
      items[next]?.focus()
    }
  }

  return { isOpen, menuPos, triggerRef, menuRef, openMenu, closeMenu, handleMenuKeyDown }
}
