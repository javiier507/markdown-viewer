import { useMemo } from 'react'
import { renderMarkdown } from '../lib/markdown.js'

export default function MarkdownView({ content }) {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <article className="prose">
      <div
        className="prose__body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}
