import DocIcon from '../shared/ui/icons/DocIcon.jsx'
import GitHubIcon from '../shared/ui/icons/GitHubIcon.jsx'
import InstallIcon from '../shared/ui/icons/InstallIcon.jsx'

export default function EmptyState({ onOpen, onInstall }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <DocIcon />
      </div>
      <h1 className="empty-state__title">Markdown Viewer</h1>
      <p className="empty-state__hint">
        Open a Markdown file or drop it here to start reading. Install the app for offline access.
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
      {onInstall && (
        <button
          type="button"
          className="empty-state__install"
          onClick={onInstall}
        >
          <InstallIcon />
          <span>Install app</span>
        </button>
      )}
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
