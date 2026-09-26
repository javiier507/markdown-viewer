export function fitView(diagram, viewport) {
  const scale = Math.min(1, Math.max(1, viewport.width - 64) / diagram.width,
    Math.max(1, viewport.height - 64) / diagram.height)
  return { scale, x: (viewport.width - diagram.width * scale) / 2,
    y: (viewport.height - diagram.height * scale) / 2, fitted: true }
}

export function zoomView(view, factor, anchor, minimum) {
  const scale = Math.min(8, Math.max(minimum, view.scale * factor))
  const ratio = scale / view.scale
  return { scale, x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio, fitted: false }
}

export function resizeView(view, diagram, previous, next) {
  if (view.fitted) return fitView(diagram, next)
  return { ...view, x: view.x + (next.width - previous.width) / 2,
    y: view.y + (next.height - previous.height) / 2 }
}

export function diagramSize(svg) {
  const values = svg.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)
  const width = values?.[2] ?? parseFloat(svg.getAttribute('width'))
  const height = values?.[3] ?? parseFloat(svg.getAttribute('height'))
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid diagram dimensions')
  }
  return { width, height }
}
