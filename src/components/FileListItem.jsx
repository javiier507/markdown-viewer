import FileIcon from '../icons/FileIcon.jsx'
import CloseIcon from '../icons/CloseIcon.jsx'

export default function FileListItem({ file, isActive, itemRef, onSelect, onRemove }) {
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
      <button
        type="button"
        className="file-item__remove"
        onClick={() => onRemove(file.id)}
        aria-label={`Remove ${file.name}`}
        title="Remove file"
      >
        <CloseIcon />
      </button>
    </li>
  )
}
