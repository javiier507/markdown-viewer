import { createPortal } from 'react-dom'
import FileIcon from '../icons/FileIcon.jsx'
import DotsIcon from '../icons/DotsIcon.jsx'
import CloseIcon from '../icons/CloseIcon.jsx'
import { useFloatingMenu } from '../hooks/useFloatingMenu.js'

export default function FileListItem({ file, isActive, itemRef, onSelect, onRemove }) {
  const { isOpen, menuPos, triggerRef, menuRef, openMenu, closeMenu, handleMenuKeyDown } =
    useFloatingMenu()

  function handleRemove() {
    closeMenu()
    onRemove(file.id)
  }

  return (
    <li
      ref={itemRef}
      className={`file-item${isActive ? ' file-item--active' : ''}`}
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
          className={`file-item__dots${isOpen ? ' file-item__dots--open' : ''}`}
          onClick={openMenu}
          aria-label={`Options for ${file.name}`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <DotsIcon />
        </button>
      </div>

      {isOpen && createPortal(
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
