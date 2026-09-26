import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MermaidDiagramModal from './MermaidDiagramModal.jsx'
import { renderDiagram } from './mermaid.js'

vi.mock('./mermaid.js', () => ({ renderDiagram: vi.fn() }))
const svg = '<svg viewBox="0 0 400 200"><text>Graph</text></svg>'
let media
let listeners
let resize
let rect
let observer

beforeEach(() => {
  rect = { width: 800, height: 600, left: 0, top: 0 }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => rect)
  observer = { observe: vi.fn(), disconnect: vi.fn() }
  vi.stubGlobal('ResizeObserver', class { constructor(callback) { resize = callback; return observer } })
  listeners = new Set()
  media = { matches: false, addEventListener: vi.fn((type, fn) => listeners.add(fn)),
    removeEventListener: vi.fn((type, fn) => listeners.delete(fn)) }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    constructor(type, init) { super(type, init); this.pointerId = init.pointerId }
  })
  vi.mocked(renderDiagram).mockReset().mockResolvedValue(svg)
})

const setup = () => {
  const trigger = document.createElement('button')
  trigger.textContent = 'Open'
  document.body.appendChild(trigger)
  const onClose = vi.fn()
  const result = render(<MermaidDiagramModal source="flowchart LR; A-->B" onClose={onClose} returnFocus={() => trigger} />)
  return { ...result, onClose, trigger }
}
const graphic = () => document.querySelector('.diagram-modal__graphic')
const ready = () => waitFor(() => expect(graphic()).not.toBeNull())

describe('expanded Mermaid viewer', () => {
  it('centers the diagram and zooms without replacing the SVG on each interaction', async () => {
    const { trigger } = setup()
    await ready()
    expect(graphic().style.transform).toBe('translate(200px, 200px) scale(1)')
    const node = graphic().querySelector('svg')
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('120%')
    expect(graphic().querySelector('svg')).toBe(node)
    fireEvent.click(screen.getByRole('button', { name: 'Actual size' }))
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('100%')
    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }))
    expect(graphic().style.transform).toBe('translate(200px, 200px) scale(1)')
    trigger.remove()
  })

  it('zooms around the wheel pointer and disables controls at the scale limits', async () => {
    const { trigger } = setup()
    await ready()
    const canvas = screen.getByRole('region', { name: 'Diagram canvas' })
    fireEvent.wheel(canvas, { deltaY: -100, clientX: 200, clientY: 200 })
    expect(graphic().style.transform).toMatch(/^translate\(200px, 200px\) scale\(1\.22/)
    for (let n = 0; n < 20; n++) fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('800%')
    for (let n = 0; n < 30; n++) fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('10%')
    trigger.remove()
  })

  it('pans with pointer capture and supports keyboard movement and reset', async () => {
    const { trigger } = setup()
    await ready()
    const canvas = screen.getByRole('region', { name: 'Diagram canvas' })
    canvas.setPointerCapture = vi.fn()
    canvas.hasPointerCapture = vi.fn(() => true)
    canvas.releasePointerCapture = vi.fn()
    fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 200, clientY: 200 })
    expect(graphic().style.transform).toBe('translate(200px, 200px) scale(1)')
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 140, clientY: 150 })
    expect(graphic().style.transform).toBe('translate(240px, 250px) scale(1)')
    fireEvent.pointerCancel(canvas, { pointerId: 1 })
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(canvas).not.toHaveClass('diagram-modal__canvas--dragging')
    fireEvent.keyDown(canvas, { key: 'ArrowLeft', shiftKey: true })
    expect(graphic().style.transform).toBe('translate(120px, 250px) scale(1)')
    fireEvent.keyDown(canvas, { key: '+' })
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('120%')
    fireEvent.keyDown(canvas, { key: '0' })
    expect(graphic().style.transform).toBe('translate(200px, 200px) scale(1)')
    trigger.remove()
  })

  it('traps focus, handles dismissal and restores background attributes and focus', async () => {
    const { trigger, onClose, unmount } = setup()
    await ready()
    const close = screen.getByRole('button', { name: 'Close diagram' })
    const canvas = screen.getByRole('region', { name: 'Diagram canvas' })
    expect(close).toHaveFocus()
    expect(trigger).toHaveAttribute('inert')
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(canvas).toHaveFocus()
    fireEvent.keyDown(canvas, { key: 'Tab' })
    expect(close).toHaveFocus()
    trigger.focus()
    expect(close).toHaveFocus()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(document.querySelector('.diagram-modal__backdrop'))
    fireEvent.keyDown(close, { key: 'Escape' })
    fireEvent.click(close)
    expect(onClose).toHaveBeenCalledTimes(3)
    unmount()
    expect(trigger).toHaveFocus()
    expect(trigger).not.toHaveAttribute('inert')
    expect(trigger).not.toHaveAttribute('aria-hidden')
    expect(observer.disconnect).toHaveBeenCalled()
    expect(listeners.size).toBe(0)
    trigger.remove()
  })

  it('preserves transformations through a theme change and viewport resize', async () => {
    const { trigger } = setup()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    const transform = graphic().style.transform
    media.matches = true
    await act(async () => listeners.forEach((fn) => fn()))
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.any(String), true, expect.any(Function))
    expect(graphic().style.transform).toBe(transform)
    rect = { ...rect, width: 1000, height: 800 }
    act(() => resize())
    expect(graphic().style.transform).toBe('translate(260px, 280px) scale(1.2)')
    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }))
    rect = { ...rect, width: 300, height: 200 }
    act(() => resize())
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('59%')
    trigger.remove()
  })

  it('shows loading and failure states, retries, and ignores obsolete results', async () => {
    let finish
    vi.mocked(renderDiagram).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const { trigger, unmount } = setup()
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Loading diagram')
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    vi.mocked(renderDiagram).mockRejectedValueOnce(new Error('Invalid source'))
    await act(async () => listeners.forEach((fn) => fn()))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not render')
    await act(async () => finish(svg))
    expect(graphic()).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await ready()
    let late
    vi.mocked(renderDiagram).mockImplementationOnce(() => new Promise((resolve) => { late = resolve }))
    act(() => listeners.forEach((fn) => fn()))
    unmount()
    await act(async () => late(svg))
    expect(screen.queryByRole('dialog')).toBeNull()
    trigger.remove()
  })

  it('restores existing background state under StrictMode', async () => {
    const background = document.createElement('div')
    background.setAttribute('aria-hidden', 'false')
    background.setAttribute('inert', 'existing')
    document.body.appendChild(background)
    const result = render(<StrictMode><MermaidDiagramModal source="test" onClose={() => {}} returnFocus={() => null} /></StrictMode>)
    await ready()
    result.unmount()
    expect(background).toHaveAttribute('aria-hidden', 'false')
    expect(background).toHaveAttribute('inert', 'existing')
    background.remove()
  })
})
