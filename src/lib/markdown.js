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

  return body.innerHTML
}
