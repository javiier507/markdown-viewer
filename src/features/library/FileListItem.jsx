import { createPortal } from 'react-dom'
import FileIcon from '../../shared/ui/icons/FileIcon.jsx'
import DotsIcon from '../../shared/ui/icons/DotsIcon.jsx'
import CloseIcon from '../../shared/ui/icons/CloseIcon.jsx'
import RefreshIcon from '../../shared/ui/icons/RefreshIcon.jsx'
import { SHORTCUTS } from '../../shared/keyboard/shortcuts.js'
import { useFloatingMenu } from './useFloatingMenu.js'

export default function FileListItem({ file, isActive, itemRef, onSelect, onRemove, onRefresh }) {
  const { isOpen, menuPos, triggerRef, menuRef, openMenu, closeMenu, handleMenuKeyDown } =
    useFloatingMenu()

  function handleRefresh() {
    closeMenu()
    onRefresh(file.id)
  }

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
          {file.path && (
            <li role="none">
              <button
                type="button"
                className="file-item__dropdown-action"
                role="menuitem"
                onClick={handleRefresh}
                aria-keyshortcuts={isActive ? SHORTCUTS.refreshFile.ariaKeyShortcuts : undefined}
              >
                <RefreshIcon />
                Refresh file
              </button>
            </li>
          )}
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
