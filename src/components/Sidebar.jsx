import PlusIcon from '../icons/PlusIcon.jsx'
import SidebarToggleIcon from '../icons/SidebarToggleIcon.jsx'
import FileList from './FileList.jsx'

export default function Sidebar({
  files,
  activeId,
  activeItemRef,
  isCollapsed,
  onAdd,
  onSelect,
  onRemove,
  onToggleCollapse,
}) {
  const toggleLabel = isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'

  return (
    <aside className={`sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`}>
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
          title={toggleLabel}
        >
          <SidebarToggleIcon isCollapsed={isCollapsed} />
        </button>
      </footer>
    </aside>
  )
}
