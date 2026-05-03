import { useMemo, useEffect, useRef } from 'react'
import { renderMarkdown } from '../lib/markdown.js'

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
  <path d="M11 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`

const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

export default function MarkdownView({ content }) {
  const html = useMemo(() => renderMarkdown(content), [content])
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    const blocks = bodyRef.current.querySelectorAll('pre')
    const timers = []

    blocks.forEach((pre) => {
      // avoid double-injecting on re-renders
      if (pre.querySelector('.code-copy')) return

      const btn = document.createElement('button')
      btn.className = 'code-copy'
      btn.setAttribute('aria-label', 'Copy code')
      btn.setAttribute('title', 'Copy code')
      btn.innerHTML = COPY_ICON

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code')
        const text = code ? code.innerText : pre.innerText
        navigator.clipboard.writeText(text).then(() => {
          btn.innerHTML = CHECK_ICON
          btn.classList.add('code-copy--copied')
          const t = setTimeout(() => {
            btn.innerHTML = COPY_ICON
            btn.classList.remove('code-copy--copied')
          }, 2000)
          timers.push(t)
        })
      })

      pre.appendChild(btn)
    })

    return () => timers.forEach(clearTimeout)
  }, [html])

  return (
    <article className="prose">
      <div
        ref={bodyRef}
        className="prose__body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
