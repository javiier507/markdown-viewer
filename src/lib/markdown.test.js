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

  it('preserves checked and unchecked task items as inert checkboxes', () => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('- [x] Done\n- [ ] Todo\n- Plain')

    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(3)
    expect(items[0].querySelector('input')).toBeChecked()
    expect(items[1].querySelector('input')).not.toBeChecked()
    expect(items[0].querySelector('input')).toBeDisabled()
    expect(items[1].querySelector('input')).toBeDisabled()
    expect(items[2].querySelector('input')).toBeNull()
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
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src="x" onerror="alert(2)">\n\n[bad](javascript:alert(3))\n\n<iframe src="https://example.com"></iframe>\n\n<form><input></form>\n\n<input type="submit">\n\n- <input type="checkbox" checked onclick="alert(4)"> Raw')
    const container = document.createElement('div')
    container.innerHTML = html

    expect(container.querySelector('script, iframe, form, input:not([type="checkbox"])')).toBeNull()
    expect(container.querySelectorAll('input')).toHaveLength(1)
    expect(container.querySelector('input')).toBeDisabled()
    expect(container.querySelector('input')).not.toHaveAttribute('onclick')
    expect(container.querySelector('img')).not.toHaveAttribute('onerror')
    expect(container.querySelector('a')).not.toHaveAttribute('href')
  })

  it.each(['', null, undefined])('returns an empty string for empty input', (input) => {
    expect(renderMarkdown(input)).toBe('')
  })
})
