import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useOpenFiles } from '../features/library/useOpenFiles.js'
import { useScrollActiveIntoView } from '../features/library/useScrollActiveIntoView.js'
import { useTauriOpenFile } from '../platform/tauri/useTauriOpenFile.js'
import { useTauriFileDrop } from '../platform/tauri/useTauriFileDrop.js'
import { useFileDrop } from '../features/library/useFileDrop.js'
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
    addFilesFromPaths,
    removeFile,
    selectFile,
  } = useOpenFiles()
  const activeItemRef = useScrollActiveIntoView(activeId)
  const fileInputRef = useRef(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const sidebarRef = useRef(null)

  const collapseSidebarOnCompactScreen = () => {
    if (!window.matchMedia('(max-width: 1024px)').matches) return
    const sidebar = sidebarRef.current
    if (sidebar?.querySelector('.sidebar__content')?.contains(document.activeElement)) {
      sidebar.querySelector('.sidebar__toggle')?.focus()
    }
    setIsSidebarCollapsed(true)
  }

  const openFiles = async (fileList) => {
    if (await addFiles(fileList)) collapseSidebarOnCompactScreen()
  }
  const openFileFromPath = (payload) => {
    if (addFileFromPath(payload)) collapseSidebarOnCompactScreen()
  }
  const openFilesFromPaths = (payloads) => {
    if (addFilesFromPaths(payloads)) collapseSidebarOnCompactScreen()
  }
  const selectDocument = (id) => {
    selectFile(id)
    collapseSidebarOnCompactScreen()
  }

  useTauriOpenFile(openFileFromPath)
  const nativeDragging = useTauriFileDrop(openFilesFromPaths)
  const { isDragging, ...dropHandlers } = useFileDrop(openFiles)

  const openFilePicker = () => fileInputRef.current?.click()
  const hasFiles = files.length > 0
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((isCollapsed) => !isCollapsed)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!hasFiles || event.defaultPrevented || event.repeat || event.isComposing
        || !event.ctrlKey || event.altKey || event.shiftKey || event.metaKey
        || event.key.toLowerCase() !== 'b') return

      const target = event.target
      if (target instanceof HTMLElement
        && (target.closest('input, textarea, select') || target.isContentEditable
          || target.closest('[contenteditable]:not([contenteditable="false"])'))) return

      event.preventDefault()
      toggleSidebar()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasFiles, toggleSidebar])

  return (
    <div className={`app ${hasFiles ? '' : 'app--empty'}`} {...dropHandlers}>
      <HiddenFileInput ref={fileInputRef} onFilesSelected={openFiles} />

      {hasFiles && (
        <Sidebar
          ref={sidebarRef}
          files={files}
          activeId={activeId}
          activeItemRef={activeItemRef}
          isCollapsed={isSidebarCollapsed}
          onAdd={openFilePicker}
          onSelect={selectDocument}
          onRemove={removeFile}
          onToggleCollapse={toggleSidebar}
        />
      )}

      <main className="content">
        {activeFile ? (
          <MarkdownView key={activeId} content={activeFile.content} />
        ) : (
          <EmptyState onOpen={openFilePicker} />
        )}
      </main>
      {(isDragging || nativeDragging) && (
        <div className="app__drop-overlay" aria-hidden="true">
          <div className="app__drop-message">Drop Markdown files to open</div>
        </div>
      )}
    </div>
  )
}

export default App
