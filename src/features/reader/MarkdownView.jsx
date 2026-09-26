import { useMemo, useEffect, useRef } from 'react'
import './reader.css'
import './syntax.css'
import { renderMarkdown } from './markdown.js'
import { renderDiagram } from './mermaid.js'

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
  <path d="M11 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`

const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

export default function MarkdownView({ content }) {
  const html = useMemo(() => renderMarkdown(content), [content])
  // Keep this prop stable so React does not reset enhanced DOM on unrelated renders.
  const markup = useMemo(() => ({ __html: html }), [html])
  const bodyRef = useRef(null)

  useEffect(() => {
    if (!bodyRef.current) return
    const blocks = bodyRef.current.querySelectorAll('pre')
    const timers = []
    const buttons = []
    let active = true

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
        const text = code ? code.textContent : pre.textContent
        navigator.clipboard.writeText(text).then(() => {
          if (!active) return
          btn.innerHTML = CHECK_ICON
          btn.classList.add('code-copy--copied')
          const t = setTimeout(() => {
            btn.innerHTML = COPY_ICON
            btn.classList.remove('code-copy--copied')
          }, 2000)
          timers.push(t)
        }).catch(() => {
          if (active) btn.setAttribute('aria-label', 'Could not copy code')
        })
      })

      pre.appendChild(btn)
      buttons.push(btn)
    })

    return () => {
      active = false
      timers.forEach(clearTimeout)
      buttons.forEach((button) => button.remove())
    }
  }, [html])

  useEffect(() => {
    const body = bodyRef.current
    const blocks = [...body.querySelectorAll('pre > code.language-mermaid')].map((code) => ({
      source: code.textContent,
      pre: code.parentElement,
      figure: null,
    }))
    if (!blocks.length) return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    let generation = 0
    let active = true

    const render = () => {
      const current = ++generation
      const isCurrent = () => active && generation === current
      blocks.forEach((block) => {
        renderDiagram(block.source, media.matches, isCurrent).then((svg) => {
          if (!isCurrent() || !svg) return
          const figure = document.createElement('figure')
          figure.className = 'prose__mermaid'
          figure.innerHTML = svg
          const diagram = figure.querySelector('svg')
          diagram.setAttribute('role', 'img')
          if (!diagram.hasAttribute('aria-labelledby') && !diagram.hasAttribute('aria-label')) {
            diagram.setAttribute('aria-label', 'Mermaid diagram')
          }
          const previous = block.figure || block.pre
          previous.replaceWith(figure)
          block.figure = figure
        }).catch(() => {
          if (!isCurrent() || !block.figure) return
          block.figure.replaceWith(block.pre)
          block.figure = null
        })
      })
    }

    render()
    media.addEventListener('change', render)
    return () => {
      active = false
      media.removeEventListener('change', render)
      blocks.forEach((block) => block.figure?.replaceWith(block.pre))
    }
  }, [html])

  return (
    <article className="prose">
      <div
        ref={bodyRef}
        className="prose__body"
        dangerouslySetInnerHTML={markup}
      />
    </article>
  )
}
