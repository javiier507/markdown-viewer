import './library.css'
import PlusIcon from '../../shared/ui/icons/PlusIcon.jsx'
import SidebarToggleIcon from '../../shared/ui/icons/SidebarToggleIcon.jsx'
import { SHORTCUTS } from '../../shared/keyboard/shortcuts.js'
import FileList from './FileList.jsx'

export default function Sidebar({
  ref,
  files,
  activeId,
  activeItemRef,
  isCollapsed,
  onAdd,
  onSelect,
  onRemove,
  onRefresh,
  onToggleCollapse,
}) {
  const toggleLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <aside ref={ref} className={`sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`}>
      <div id="sidebar-content" className="sidebar__content" hidden={isCollapsed}>
        <header className="sidebar__header">
          <h2 className="sidebar__title">Files</h2>
          <button
            type="button"
            className="sidebar__add"
            onClick={onAdd}
            aria-label="Add file"
            title="Add file"
          >
            <PlusIcon />
          </button>
        </header>

        <FileList
          files={files}
          activeId={activeId}
          activeItemRef={activeItemRef}
          onSelect={onSelect}
          onRemove={onRemove}
          onRefresh={onRefresh}
        />
      </div>

      <footer className="sidebar__footer">
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggleCollapse}
          aria-controls="sidebar-content"
          aria-expanded={!isCollapsed}
          aria-label={toggleLabel}
          aria-keyshortcuts={SHORTCUTS.toggleSidebar.ariaKeyShortcuts}
          title={`${toggleLabel} (${SHORTCUTS.toggleSidebar.label})`}
        >
          <SidebarToggleIcon isCollapsed={isCollapsed} />
        </button>
      </footer>
    </aside>
  )
}
