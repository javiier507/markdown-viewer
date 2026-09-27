// Resolve only within this reader; document IDs may also exist in app chrome.
export function attachAnchorNavigation(body) {
  const focusableTargets = new Set()
  const navigate = (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null
    if (!link || !body.contains(link)) return
    const href = link.getAttribute('href')
    if (!href.startsWith('#')) return
    event.preventDefault()

    let fragment
    try {
      fragment = decodeURIComponent(href.slice(1))
    } catch {
      return
    }
    const target = fragment === '' ? body : [...body.querySelectorAll('[id], a[name]')]
      .find((element) => element.id === fragment || element.getAttribute('name') === fragment)
    if (!(target instanceof HTMLElement)) return

    target.focus({ preventScroll: true })
    if (body.ownerDocument.activeElement !== target && !target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1')
      focusableTargets.add(target)
      target.focus({ preventScroll: true })
    }
    target.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' })
  }
  body.addEventListener('click', navigate)
  return () => {
    body.removeEventListener('click', navigate)
    focusableTargets.forEach((target) => target.removeAttribute('tabindex'))
  }
}
