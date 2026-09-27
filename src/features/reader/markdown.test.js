import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown.js'

describe('renderMarkdown', () => {
  it.each([
    ['[Web](https://example.com/docs#section)', 'https://example.com/docs#section'],
    ['[Web](http://example.com)', 'http://example.com/'],
    ['[Web](//example.com/docs)', 'https://example.com/docs'],
    ['<a href="HTTPS://example.com/docs" target="_self" rel="opener">Web</a>', 'https://example.com/docs'],
    ['<a href="//example.com/docs" target="named-window">Web</a>', 'https://example.com/docs'],
  ])('opens external links safely outside the reader: %s', (source, href) => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown(source)
    const link = container.querySelector('a')
    expect(link).toHaveAttribute('href', href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it.each(['#section', 'other.md#section', './other.md', '/docs', 'mailto:reader@example.com', 'tel:123', 'https://'])(
    'does not treat local links, other protocols or malformed URLs as internet links: %s', (href) => {
      const container = document.createElement('div')
      container.innerHTML = renderMarkdown(`[Link](${href})`)
      const link = container.querySelector('a')
      expect(link).toHaveAttribute('href', href)
      expect(link).not.toHaveAttribute('target')
      expect(link).not.toHaveAttribute('rel')
    })

  it('keeps unsafe HTML links inert while enhancing safe links', () => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('<a href="javascript:alert(1)" target="_blank" onclick="alert(2)">Bad</a>\n\n<a href="https://example.com" onclick="alert(3)">Safe</a>')
    const [bad, safe] = container.querySelectorAll('a')
    expect(bad).not.toHaveAttribute('href')
    expect(bad).not.toHaveAttribute('target')
    expect(container.querySelector('[onclick]')).toBeNull()
    expect(safe).toHaveAttribute('target', '_blank')
  })

  it('creates stable anchors from visible heading text at every level', () => {
    const source = '# **Hello** `World`!\n\n## Instalación rápida\n\n### 中文标题\n\n#### A & B\n\n##### snake_case-dash\n\n###### !!!'
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown(source)
    expect([...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading) => heading.id))
      .toEqual(['hello-world', 'instalación-rápida', '中文标题', 'a-b', 'snake_case-dash', 'section'])
    expect(renderMarkdown(source)).toBe(container.innerHTML)
  })

  it('reserves explicit destinations before assigning unique heading anchors', () => {
    const source = '# Topic\n\n## Topic\n\n### Topic-1\n\n<a id="topic"></a>\n\n<a name="topic-2"></a>\n\n<h4 id="custom">Topic</h4>'
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown(source)
    expect([...container.querySelectorAll('h1, h2, h3, h4')].map((heading) => heading.id))
      .toEqual(['topic-1', 'topic-3', 'topic-1-1', 'custom'])
    expect(container.querySelector('a[id]')).toHaveAttribute('id', 'topic')
    expect(container.querySelector('a[name]')).toHaveAttribute('name', 'topic-2')
    container.innerHTML = renderMarkdown('# Topic')
    expect(container.querySelector('h1').id).toBe('topic')
  })

  it('preserves Mermaid source as inert plain text', () => {
    const source = 'flowchart LR\n  A["<script>alert(1)</script>"] --> B["A & B"]'
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('```mermaid\n' + source + '\n```')
    const code = container.querySelector('pre > code.language-mermaid')
    expect(code.textContent).toBe(source + '\n')
    expect(code.querySelector('script, span')).toBeNull()
  })
  it('renders GitHub Flavored Markdown', () => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('# Title\n\n~~old~~\n\n| A | B |\n| - | - |\n| 1 | 2 |')

    expect(container.querySelector('h1')).toHaveTextContent('Title')
    expect(container.querySelector('del')).toHaveTextContent('old')
    expect(container.querySelectorAll('table tbody td')).toHaveLength(2)
  })

  it.each([
    '| A | B |\n| - | - |\n| 1 | 2 |',
    '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
  ])('contains each table in an accessible scrolling region', (source) => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown(source + '\n\n' + source)

    const regions = container.querySelectorAll('.prose__table-scroll')
    expect(regions).toHaveLength(2)
    regions.forEach((region) => {
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveAttribute('role', 'region')
      expect(region).toHaveAccessibleName('Scrollable table')
      expect(region.querySelectorAll(':scope > table')).toHaveLength(1)
      expect(region.querySelectorAll('th')).toHaveLength(2)
      expect(region.querySelectorAll('tbody td')).toHaveLength(2)
      expect([...region.querySelectorAll('tbody td')].map((cell) => cell.textContent)).toEqual(['1', '2'])
    })
  })

  it('sanitizes raw HTML tables before adding scrolling regions', () => {
    const container = document.createElement('div')
    container.innerHTML = renderMarkdown('<table onclick="alert(1)"><tr><td><img src="x" onerror="alert(2)"><script>alert(3)</script>Safe</td></tr></table>')

    expect(container.querySelector('.prose__table-scroll table')).not.toBeNull()
    expect(container.querySelector('td')).toHaveTextContent('Safe')
    expect(container.querySelector('script, [onclick], [onerror]')).toBeNull()
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
