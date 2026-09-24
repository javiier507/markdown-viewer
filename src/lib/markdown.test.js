import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown.js'

describe('renderMarkdown', () => {
  it('renders GitHub Flavored Markdown', () => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('# Title\n\n~~old~~\n\n| A | B |\n| - | - |\n| 1 | 2 |')

    expect(container.querySelector('h1')).toHaveTextContent('Title')
    expect(container.querySelector('del')).toHaveTextContent('old')
    expect(container.querySelectorAll('table tbody td')).toHaveLength(2)
  })

  it('highlights known languages and safely renders unknown languages', () => {
    const html = renderMarkdown('```js\nconst x = 1\n```\n\n```madeup\nconst y = 2\n```')
    const container = document.createElement('div')
    container.innerHTML = html
    const blocks = container.querySelectorAll('pre code')

    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toHaveClass('hljs', 'language-js')
    expect(blocks[0]).toHaveTextContent('const x = 1')
    expect(blocks[1]).toHaveTextContent('const y = 2')
  })

  it('removes scripts, event handlers, dangerous URLs, iframes and forms', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[bad](javascript:alert(3))\n\n<iframe src="https://example.com"></iframe>\n\n<form><input></form>')
    const container = document.createElement('div')
    container.innerHTML = html

    expect(container.querySelector('script, iframe, form, input')).toBeNull()
    expect(container.querySelector('img')).not.toHaveAttribute('onerror')
    expect(container.querySelector('a')).not.toHaveAttribute('href')
  })

  it.each(['', null, undefined])('returns an empty string for empty input', (input) => {
    expect(renderMarkdown(input)).toBe('')
  })
})
