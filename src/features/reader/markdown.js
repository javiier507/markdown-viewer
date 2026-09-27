import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

marked.use(
  { gfm: true, breaks: false },
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang === 'mermaid') return hljs.highlight(code, { language: 'plaintext' }).value
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    },
  }),
)

export function renderMarkdown(text) {
  if (!text) return ''
  // marked.parse() is synchronous here — no async extensions are configured
  const body = DOMPurify.sanitize(marked.parse(text), {
    RETURN_DOM: true,
    FORBID_TAGS: ['form', 'button', 'textarea', 'select', 'option'],
  })

  const reserved = new Set([...body.querySelectorAll('[id], a[name]')]
    .flatMap((element) => [element.getAttribute('id'), element.getAttribute('name')])
    .filter(Boolean))
  body.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    if (heading.id) return
    const base = heading.textContent.toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
      .trim().replace(/\s+/g, '-') || 'section'
    let id = base
    let suffix = 0
    while (reserved.has(id)) id = `${base}-${++suffix}`
    heading.id = id
    reserved.add(id)
  })

  body.querySelectorAll('input').forEach((input) => {
    if (input.type !== 'checkbox' || input.parentElement?.tagName !== 'LI' || input.parentElement.firstElementChild !== input) {
      input.remove()
      return
    }

    const checked = input.checked
    for (const attribute of [...input.attributes]) input.removeAttribute(attribute.name)
    input.type = 'checkbox'
    input.disabled = true
    if (checked) input.setAttribute('checked', '')
  })

  body.querySelectorAll('table').forEach((table) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'prose__table-scroll'
    wrapper.tabIndex = 0
    wrapper.setAttribute('role', 'region')
    wrapper.setAttribute('aria-label', 'Scrollable table')
    table.replaceWith(wrapper)
    wrapper.appendChild(table)
  })

  return body.innerHTML
}
