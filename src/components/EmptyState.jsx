import DocIcon from '../icons/DocIcon.jsx'
import GitHubIcon from '../icons/GitHubIcon.jsx'

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
      <div className="empty-state__taglines">
        <p className="empty-state__tagline">
          Free · Open Source · Offline · No tracking
        </p>
        <p className="empty-state__tagline">Forever</p>
      </div>
      <a
        className="empty-state__repo"
        href="https://github.com/javiier507/markdown-viewer"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon />
        <span>View on GitHub</span>
      </a>
    </div>
  )
}
