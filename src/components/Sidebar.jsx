import PlusIcon from '../icons/PlusIcon.jsx'
import FileList from './FileList.jsx'

export default function Sidebar({
  files,
  activeId,
  activeItemRef,
  onAdd,
  onSelect,
  onRemove,
}) {
  return (
    <aside className="sidebar">
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
    </aside>
  )
}
