import { useRef } from 'react'
import './App.css'
import './syntax.css'
import { useOpenFiles } from './hooks/useOpenFiles.js'
import { useScrollActiveIntoView } from './hooks/useScrollActiveIntoView.js'
import HiddenFileInput from './components/HiddenFileInput.jsx'
import Sidebar from './components/Sidebar.jsx'
import MarkdownView from './components/MarkdownView.jsx'
import EmptyState from './components/EmptyState.jsx'

function App() {
  const { files, activeId, activeFile, addFiles, removeFile, selectFile } =
    useOpenFiles()
  const activeItemRef = useScrollActiveIntoView(activeId)
  const fileInputRef = useRef(null)

  const openFilePicker = () => fileInputRef.current?.click()
  const hasFiles = files.length > 0

  return (
    <div className={`app ${hasFiles ? 'app--with-sidebar' : 'app--empty'}`}>
      <HiddenFileInput ref={fileInputRef} onFilesSelected={addFiles} />

      {hasFiles && (
        <Sidebar
          files={files}
          activeId={activeId}
          activeItemRef={activeItemRef}
          onAdd={openFilePicker}
          onSelect={selectFile}
          onRemove={removeFile}
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
