import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderDiagram, sanitizeDiagram } from './mermaid.js'

const mermaid = vi.hoisted(() => ({ initialize: vi.fn(), render: vi.fn() }))
vi.mock('mermaid', () => ({ default: mermaid }))

beforeEach(() => {
  mermaid.initialize.mockReset()
  mermaid.render.mockReset().mockResolvedValue({ svg: '<svg><text>Diagram</text></svg>' })
})

describe('Mermaid renderer', () => {
  it('renders with strict security and unique IDs, and removes staging nodes', async () => {
    await renderDiagram('flowchart LR; A-->B', false)
    await renderDiagram('sequenceDiagram\nA->>B: Hello', true)
    expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({
      theme: 'dark', securityLevel: 'strict', htmlLabels: false,
      startOnLoad: false, suppressErrorRendering: true,
    }))
    expect(mermaid.render.mock.calls[0][0]).not.toBe(mermaid.render.mock.calls[1][0])
    expect(document.querySelector('.mermaid-staging')).toBeNull()
  })

  it('serializes initialization and rendering across themes', async () => {
    let finish
    mermaid.render.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const first = renderDiagram('first', false)
    const second = renderDiagram('second', true)
    await vi.waitFor(() => expect(finish).toBeDefined())
    expect(mermaid.initialize).toHaveBeenCalledTimes(1)
    finish({ svg: '<svg></svg>' })
    await Promise.all([first, second])
    expect(mermaid.initialize.mock.calls.map(([config]) => config.theme)).toEqual(['default', 'dark'])
  })

  it('recovers after rendering errors and cleans up temporary nodes', async () => {
    mermaid.render.mockRejectedValueOnce(new Error('Invalid diagram'))
    await expect(renderDiagram('bad', false)).rejects.toThrow('Invalid diagram')
    expect(document.querySelector('.mermaid-staging')).toBeNull()
    await expect(renderDiagram('good', false)).resolves.toContain('<svg>')
  })

  it('skips stale tasks and rejects missing SVG output', async () => {
    await expect(renderDiagram('old', false, () => false)).resolves.toBeNull()
    expect(mermaid.render).not.toHaveBeenCalled()
    mermaid.render.mockResolvedValueOnce({ svg: '<script>alert(1)</script>' })
    await expect(renderDiagram('bad output', false)).rejects.toThrow('Missing Mermaid SVG')
  })

  it('sanitizes SVG while preserving labels, styles and arrow markers', () => {
    const svg = sanitizeDiagram(`<svg aria-labelledby="title" onload="alert(1)">
      <title id="title">Safe</title><desc>Description</desc>
      <style>#diagram { fill: red; }</style>
      <defs><marker id="arrow"><path d="M0 0L1 1" /></marker></defs>
      <path marker-end="url(#arrow)" />
      <script>alert(1)</script><foreignObject><div>Unsafe</div></foreignObject>
      <a href="javascript:alert(1)"><text>Label</text></a><image href="https://example.com/image" />
    </svg>`)
    const host = document.createElement('div')
    host.innerHTML = svg
    expect(host.querySelector('script, foreignObject, a, image')).toBeNull()
    expect(host.querySelector('svg')).not.toHaveAttribute('onload')
    expect(host.querySelector('title')).toHaveTextContent('Safe')
    expect(host.querySelector('desc')).toHaveTextContent('Description')
    expect(host.querySelector('marker')).toHaveAttribute('id', 'arrow')
    expect(host.querySelector('path[marker-end]')).toHaveAttribute('marker-end', 'url(#arrow)')
    expect(host.querySelector('style')).not.toBeNull()
  })
})
