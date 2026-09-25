import { useRef, useState } from 'react'
import './App.css'
import { useOpenFiles } from '../features/library/useOpenFiles.js'
import { useScrollActiveIntoView } from '../features/library/useScrollActiveIntoView.js'
import { useTauriOpenFile } from '../platform/tauri/useTauriOpenFile.js'
import HiddenFileInput from '../features/library/HiddenFileInput.jsx'
import Sidebar from '../features/library/Sidebar.jsx'
import MarkdownView from '../features/reader/MarkdownView.jsx'
import EmptyState from './EmptyState.jsx'

function App() {
  const {
    files,
    activeId,
    activeFile,
    addFiles,
    addFileFromPath,
    removeFile,
    selectFile,
  } = useOpenFiles()
  const activeItemRef = useScrollActiveIntoView(activeId)
  const fileInputRef = useRef(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useTauriOpenFile(addFileFromPath)

  const openFilePicker = () => fileInputRef.current?.click()
  const hasFiles = files.length > 0

  return (
    <div className={`app ${hasFiles ? '' : 'app--empty'}`}>
      <HiddenFileInput ref={fileInputRef} onFilesSelected={addFiles} />

      {hasFiles && (
        <Sidebar
          files={files}
          activeId={activeId}
          activeItemRef={activeItemRef}
          isCollapsed={isSidebarCollapsed}
          onAdd={openFilePicker}
          onSelect={selectFile}
          onRemove={removeFile}
          onToggleCollapse={() => setIsSidebarCollapsed((isCollapsed) => !isCollapsed)}
        />
      )}

      <main className="content">
        {activeFile ? (
          <MarkdownView content={activeFile.content} />
        ) : (
          <EmptyState onOpen={openFilePicker} />
        )}
      </main>
    </div>
  )
}

export default App
