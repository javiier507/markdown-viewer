import FileListItem from './FileListItem.jsx'

export default function FileList({ files, activeId, activeItemRef, onSelect, onRemove }) {
  return (
    <ul className="file-list">
      {files.map((file) => {
        const isActive = file.id === activeId
        return (
          <FileListItem
            key={file.id}
            file={file}
            isActive={isActive}
            itemRef={isActive ? activeItemRef : null}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        )
      })}
    </ul>
  )
}
