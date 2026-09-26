import { describe, expect, it } from 'vitest'
import { diagramSize, fitView, resizeView, zoomView } from './diagramViewport.js'

const viewport = { width: 800, height: 600 }

describe('diagram viewport geometry', () => {
  it('centers small diagrams without upscaling and fits wide diagrams with padding', () => {
    expect(fitView({ width: 400, height: 200 }, viewport)).toEqual({ scale: 1, x: 200, y: 200, fitted: true })
    const fit = fitView({ width: 1600, height: 200 }, viewport)
    expect(fit.scale).toBeCloseTo(0.46)
    expect(fit.x).toBe(32)
  })

  it('keeps the same diagram point under the zoom anchor', () => {
    const previous = { scale: 2, x: 100, y: 150 }
    const anchor = { x: 300, y: 200 }
    const next = zoomView(previous, 1.2, anchor, 0.1)
    expect((anchor.x - next.x) / next.scale).toBeCloseTo((anchor.x - previous.x) / previous.scale)
    expect((anchor.y - next.y) / next.scale).toBeCloseTo((anchor.y - previous.y) / previous.scale)
  })

  it('clamps zoom while allowing very large diagrams to fit below ten percent', () => {
    const view = { scale: 1, x: 0, y: 0 }
    expect(zoomView(view, 20, { x: 0, y: 0 }, 0.1).scale).toBe(8)
    expect(zoomView(view, 0.001, { x: 0, y: 0 }, 0.1).scale).toBe(0.1)
    const fit = fitView({ width: 20000, height: 10000 }, viewport)
    expect(zoomView(view, 0.001, { x: 0, y: 0 }, fit.scale).scale).toBe(fit.scale)
  })

  it('refits fitted views and preserves manual views relative to the viewport center', () => {
    const diagram = { width: 1600, height: 800 }
    const next = { width: 1000, height: 900 }
    expect(resizeView(fitView(diagram, viewport), diagram, viewport, next)).toEqual(fitView(diagram, next))
    expect(resizeView({ scale: 2, x: 20, y: 50, fitted: false }, diagram, viewport, next))
      .toEqual({ scale: 2, x: 120, y: 200, fitted: false })
  })

  it('reads SVG viewBox dimensions and rejects invalid dimensions', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '-10 -20 400 200')
    expect(diagramSize(svg)).toEqual({ width: 400, height: 200 })
    svg.setAttribute('viewBox', '0 0 0 NaN')
    expect(() => diagramSize(svg)).toThrow('Invalid diagram dimensions')
  })
})
