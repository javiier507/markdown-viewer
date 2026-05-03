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
  return DOMPurify.sanitize(marked.parse(text))
}
