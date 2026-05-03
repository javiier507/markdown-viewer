import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import FileIcon from '../icons/FileIcon.jsx'
import DotsIcon from '../icons/DotsIcon.jsx'
import CloseIcon from '../icons/CloseIcon.jsx'

const MENU_WIDTH = 148
const MENU_HEIGHT = 44 // approximate single-item height

function getMenuPos(triggerEl) {
  const rect = triggerEl.getBoundingClientRect()
  const top = rect.bottom + 4 + MENU_HEIGHT > window.innerHeight
    ? rect.top - MENU_HEIGHT - 4
    : rect.bottom + 4
  const left = rect.left + MENU_WIDTH > window.innerWidth
    ? window.innerWidth - MENU_WIDTH - 8
    : rect.left
  return { top, left }
}

export default function FileListItem({ file, isActive, itemRef, onSelect, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  const reposition = useCallback(() => {
    if (triggerRef.current) setMenuPos(getMenuPos(triggerRef.current))
  }, [])

  // Close on outside click; reposition on resize/scroll
  useEffect(() => {
    if (!menuOpen) return
    function handleClose(e) {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false)
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
  }, [menuOpen, reposition])

  // Move focus into the menu when it opens
  useEffect(() => {
    if (!menuOpen) return
    const id = requestAnimationFrame(() => {
      menuRef.current?.querySelector('[role="menuitem"]')?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [menuOpen])

  function openMenu(e) {
    e.stopPropagation()
    if (!triggerRef.current) return
    if (!menuOpen) setMenuPos(getMenuPos(triggerRef.current))
    setMenuOpen((o) => !o)
  }

  function handleRemove() {
    setMenuOpen(false)
    onRemove(file.id)
  }

  function handleMenuKeyDown(e) {
    if (e.key === 'Escape') {
      setMenuOpen(false)
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

  return (
    <li
      ref={itemRef}
      className={`file-item ${isActive ? 'file-item--active' : ''}`}
    >
      <button
        type="button"
        className="file-item__select"
        onClick={() => onSelect(file.id)}
        title={file.name}
      >
        <FileIcon />
        <span className="file-item__name">{file.name}</span>
      </button>

      <div className="file-item__menu-wrap">
        <button
          ref={triggerRef}
          type="button"
          className={`file-item__dots${menuOpen ? ' file-item__dots--open' : ''}`}
          onClick={openMenu}
          aria-label={`Options for ${file.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <DotsIcon />
        </button>
      </div>

      {menuOpen && createPortal(
        <ul
          ref={menuRef}
          className="file-item__dropdown"
          role="menu"
          style={{ top: menuPos.top, left: menuPos.left }}
          onKeyDown={handleMenuKeyDown}
        >
          <li role="none">
            <button
              type="button"
              className="file-item__dropdown-action file-item__dropdown-action--danger"
              role="menuitem"
              onClick={handleRemove}
            >
              <CloseIcon />
              Remove file
            </button>
          </li>
        </ul>,
        document.body
      )}
    </li>
  )
}
