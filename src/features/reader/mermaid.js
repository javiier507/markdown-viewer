import DOMPurify from 'dompurify'

let library
let queue = Promise.resolve()
let nextId = 0

function loadMermaid() {
  library ??= import('mermaid').then(({ default: mermaid }) => mermaid).catch((error) => {
    library = undefined
    throw error
  })
  return library
}

export function sanitizeDiagram(svg) {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject', 'a', 'image'],
  })
}

// Mermaid configuration is global, so initialization and rendering share a queue.
export function renderDiagram(source, dark, isCurrent = () => true) {
  const task = queue.then(async () => {
    if (!isCurrent()) return null
    const mermaid = await loadMermaid()
    if (!isCurrent()) return null
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      htmlLabels: false,
      suppressErrorRendering: true,
      theme: dark ? 'dark' : 'default',
      fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--sans').trim() || 'sans-serif',
      secure: [
        'secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'maxEdges',
        'suppressErrorRendering', 'htmlLabels', 'dompurifyConfig',
        'themeCSS', 'fontFamily', 'altFontFamily', 'theme', 'themeVariables',
      ],
    })

    const staging = document.createElement('div')
    staging.className = 'mermaid-staging'
    staging.setAttribute('aria-hidden', 'true')
    document.body.appendChild(staging)
    try {
      const { svg } = await mermaid.render(`reader-mermaid-${++nextId}`, source, staging)
      if (!isCurrent()) return null
      const clean = sanitizeDiagram(svg)
      const fragment = document.createElement('template')
      fragment.innerHTML = clean
      if (!fragment.content.querySelector('svg')) throw new Error('Missing Mermaid SVG')
      return clean
    } finally {
      staging.remove()
    }
  })
  queue = task.catch(() => {})
  return task
}
