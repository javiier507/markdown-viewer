import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import FileIcon from '../icons/FileIcon.jsx'
import DotsIcon from '../icons/DotsIcon.jsx'
import CloseIcon from '../icons/CloseIcon.jsx'

export default function FileListItem({ file, isActive, itemRef, onSelect, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClose(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          triggerRef.current && !triggerRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [menuOpen])

  function openMenu(e) {
    e.stopPropagation()
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left })
    setMenuOpen((o) => !o)
  }

  function handleRemove() {
    setMenuOpen(false)
    onRemove(file.id)
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
          title="Options"
          aria-haspopup="true"
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
