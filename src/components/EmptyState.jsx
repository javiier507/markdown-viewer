import DocIcon from '../icons/DocIcon.jsx'

export default function EmptyState({ onOpen }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <DocIcon />
      </div>
      <h1 className="empty-state__title">Markdown Viewer</h1>
      <p className="empty-state__hint">
        Open a markdown file to start reading.
      </p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={onOpen}
      >
        Open File
      </button>
    </div>
  )
}
