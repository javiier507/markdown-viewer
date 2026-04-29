import { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'
import './App.css'
import './syntax.css'

marked.use({ gfm: true, breaks: false })
marked.use(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    },
  }),
)

function App() {
  const [files, setFiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const fileInputRef = useRef(null)
  const activeItemRef = useRef(null)
  const nextIdRef = useRef(1)

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeId) ?? null,
    [files, activeId],
  )

  const renderedHtml = useMemo(() => {
    if (!activeFile) return ''
    const raw = marked.parse(activeFile.content)
    return DOMPurify.sanitize(raw)
  }, [activeFile])

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (event) => {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (picked.length === 0) return

    const results = await Promise.allSettled(
      picked.map(async (file) => ({
        id: nextIdRef.current++,
        name: file.name,
        content: await file.text(),
      })),
    )

    const loaded = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)

    if (loaded.length === 0) return

    setFiles((prev) => [...prev, ...loaded])
    setActiveId(loaded[0].id)
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
  }

  const hasFiles = files.length > 0

  return (
    <div className={`app ${hasFiles ? 'app--with-sidebar' : 'app--empty'}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.mdx,.txt,text/markdown"
        multiple
        onChange={handleFilesSelected}
        hidden
      />

      {hasFiles && (
        <aside className="sidebar">
          <header className="sidebar__header">
            <h2 className="sidebar__title">Files</h2>
            <button
              type="button"
              className="sidebar__add"
              onClick={openFilePicker}
              aria-label="Add file"
              title="Add file"
            >
              <PlusIcon />
            </button>
          </header>

          <ul className="file-list">
            {files.map((file) => {
              const isActive = file.id === activeId
              return (
                <li
                  key={file.id}
                  ref={isActive ? activeItemRef : null}
                  className={`file-item ${isActive ? 'file-item--active' : ''}`}
                >
                  <button
                    type="button"
                    className="file-item__select"
                    onClick={() => setActiveId(file.id)}
                    title={file.name}
                  >
                    <FileIcon />
                    <span className="file-item__name">{file.name}</span>
                  </button>
                  <button
                    type="button"
                    className="file-item__remove"
                    onClick={() => removeFile(file.id)}
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                  >
                    <CloseIcon />
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      )}

      <main className="content">
        {activeFile ? (
          <article className="prose">
            <div
              className="prose__body"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </article>
        ) : (
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
              onClick={openFilePicker}
            >
              Open File
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 1.75A1.25 1.25 0 014.75.5h5l3.75 3.75v9.75a1.25 1.25 0 01-1.25 1.25H4.75a1.25 1.25 0 01-1.25-1.25V1.75z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 0.75v3.5h3.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path
        d="M11 6.5A2.5 2.5 0 0113.5 4h13L35 12.5V37.5A2.5 2.5 0 0132.5 40h-19A2.5 2.5 0 0111 37.5v-31z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M26 4v8.5h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 22h13M16.5 27h13M16.5 32h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default App
