import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useOpenFiles } from '../features/library/useOpenFiles.js'
import { useScrollActiveIntoView } from '../features/library/useScrollActiveIntoView.js'
import { useTauriOpenFile } from '../platform/tauri/useTauriOpenFile.js'
import { useTauriFileDrop } from '../platform/tauri/useTauriFileDrop.js'
import { readFileFromPath } from '../platform/tauri/readFileFromPath.js'
import { isTauri, pickFilesFromDialog } from '../platform/tauri/pickFilesFromDialog.js'
import { useInstallPrompt } from '../platform/web/useInstallPrompt.js'
import { useFileDrop } from '../features/library/useFileDrop.js'
import HiddenFileInput from '../features/library/HiddenFileInput.jsx'
import Sidebar from '../features/library/Sidebar.jsx'
import MarkdownView from '../features/reader/MarkdownView.jsx'
import { SHORTCUTS, matchesShortcut } from '../shared/keyboard/shortcuts.js'
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
    updateFileContent,
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
  const { canInstall, install } = useInstallPrompt()
  const onInstall = canInstall ? install : undefined

  const openFilePicker = async () => {
    if (!isTauri()) {
      fileInputRef.current?.click()
      return
    }
    const payloads = await pickFilesFromDialog()
    if (payloads.length > 0) openFilesFromPaths(payloads)
  }
  const hasFiles = files.length > 0
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((isCollapsed) => !isCollapsed)
  }, [])

  // Only native files keep a path; browser File objects cannot be reread reliably.
  const refreshFile = async (id) => {
    const file = files.find((f) => f.id === id)
    if (!file?.path) return
    const payload = await readFileFromPath(file.path)
    if (payload) updateFileContent(id, payload.content)
  }
  const refreshFileRef = useRef(refreshFile)
  useEffect(() => {
    refreshFileRef.current = refreshFile
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!hasFiles || event.defaultPrevented || event.repeat || event.isComposing) return
      const isToggleSidebar = matchesShortcut(event, SHORTCUTS.toggleSidebar)
      const isRefreshFile = matchesShortcut(event, SHORTCUTS.refreshFile)
      if (!isToggleSidebar && !isRefreshFile) return

      const target = event.target
      if (target instanceof HTMLElement
        && (target.closest('input, textarea, select') || target.isContentEditable
          || target.closest('[contenteditable]:not([contenteditable="false"])'))) return

      // Also blocks Ctrl+R from reloading the page, which would drop every open document.
      event.preventDefault()
      if (isToggleSidebar) toggleSidebar()
      else if (activeId != null) refreshFileRef.current(activeId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasFiles, activeId, toggleSidebar])

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
          onRefresh={refreshFile}
          onInstall={onInstall}
          onToggleCollapse={toggleSidebar}
        />
      )}

      <main className="content">
        {activeFile ? (
          <MarkdownView key={activeId} content={activeFile.content} />
        ) : (
          <EmptyState onOpen={openFilePicker} onInstall={onInstall} />
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
