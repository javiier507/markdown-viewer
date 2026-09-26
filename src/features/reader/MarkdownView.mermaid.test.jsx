import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownView from './MarkdownView.jsx'
import { renderDiagram } from './mermaid.js'

vi.mock('./mermaid.js', () => ({ renderDiagram: vi.fn() }))

const flow = '```mermaid\nflowchart LR\nA-->B\n```'
let media
let listeners

beforeEach(() => {
  listeners = new Set()
  media = {
    matches: false,
    addEventListener: vi.fn((event, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((event, listener) => listeners.delete(listener)),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.mocked(renderDiagram).mockReset().mockResolvedValue('<svg><text>Graph</text></svg>')
})

describe('Mermaid document enhancements', () => {
  it('opens the selected diagram from its button or graphic and restores focus', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg viewBox="0 0 400 200"><text>Graph</text></svg>')
    const second = '```mermaid\nsequenceDiagram\nA->>B: Hello\n```'
    const { container } = render(<MarkdownView content={flow + '\n\n' + second} />)
    const buttons = await screen.findAllByRole('button', { name: 'Expand diagram' })
    buttons[1].focus()
    fireEvent.click(buttons[1])
    expect(screen.getByRole('dialog', { name: 'Mermaid diagram' })).toBeInTheDocument()
    await waitFor(() => expect(renderDiagram).toHaveBeenLastCalledWith('sequenceDiagram\nA->>B: Hello\n', false, expect.any(Function)))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(buttons[1]).toHaveFocus()
    fireEvent.click(container.querySelector('.prose__mermaid svg'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(renderDiagram).toHaveBeenLastCalledWith('flowchart LR\nA-->B\n', false, expect.any(Function)))
    fireEvent.click(screen.getByRole('button', { name: 'Close diagram' }))
    expect(buttons[0]).toHaveFocus()
  })

  it('restores focus to the regenerated expand button after a theme change', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg viewBox="0 0 400 200"><text>Graph</text></svg>')
    render(<MarkdownView content={flow} />)
    const oldButton = await screen.findByRole('button', { name: 'Expand diagram' })
    fireEvent.click(oldButton)
    media.matches = true
    await act(async () => listeners.forEach((listener) => listener()))
    fireEvent.click(screen.getByRole('button', { name: 'Close diagram' }))
    expect(oldButton.isConnected).toBe(false)
    expect(screen.getByRole('button', { name: 'Expand diagram' })).toHaveFocus()
  })

  it('closes the viewer when content changes and does not reopen when content returns', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg viewBox="0 0 400 200"><text>Graph</text></svg>')
    const { rerender } = render(<MarkdownView content={flow} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Expand diagram' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    rerender(<MarkdownView content="# New document" />)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<MarkdownView content={flow} />)
    await screen.findByRole('button', { name: 'Expand diagram' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('replaces multiple Mermaid blocks while preserving ordinary code', async () => {
    const { container, rerender } = render(<MarkdownView content={flow + '\n\n' + flow + '\n\n```js\nconst x = 1\n```'} />)
    await waitFor(() => expect(screen.getAllByRole('img', { name: 'Mermaid diagram' })).toHaveLength(2))
    expect(container.querySelectorAll('pre')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1)
    expect(renderDiagram).toHaveBeenCalledWith('flowchart LR\nA-->B\n', false, expect.any(Function))
    rerender(<MarkdownView content={flow + '\n\n' + flow + '\n\n```js\nconst x = 1\n```'} />)
    expect(renderDiagram).toHaveBeenCalledTimes(2)
    expect(container.querySelectorAll('figure')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(1)
  })

  it('keeps invalid blocks copyable and renders the remaining document', async () => {
    vi.mocked(renderDiagram).mockRejectedValueOnce(new Error('Invalid syntax'))
    const { container } = render(<MarkdownView content={'# Title\n\n' + flow + '\n\n' + flow} />)
    await screen.findByRole('img')
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
    expect(container.querySelector('pre code')).toHaveTextContent('flowchart LR')
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })

  it('keeps source visible when the library fails to load', async () => {
    vi.mocked(renderDiagram).mockRejectedValue(new Error('Loading failed'))
    const { container } = render(<MarkdownView content={flow} />)
    await act(async () => {})
    expect(container.querySelector('pre')).toHaveTextContent('flowchart LR')
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
    expect(container.querySelector('figure')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Expand diagram' })).toBeNull()
  })

  it('ignores a result from a previous document', async () => {
    let finish
    vi.mocked(renderDiagram).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const { container, rerender } = render(<MarkdownView content={flow} />)
    expect(container.querySelector('pre')).not.toBeNull()
    rerender(<MarkdownView content={'# New document'} />)
    await act(async () => finish('<svg></svg>'))
    expect(screen.getByRole('heading', { name: 'New document' })).toBeInTheDocument()
    expect(container.querySelector('figure')).toBeNull()
  })

  it('rerenders for the system theme and restores source if the new render fails', async () => {
    const { container, unmount } = render(<MarkdownView content={flow} />)
    await screen.findByRole('img')
    media.matches = true
    await act(async () => listeners.forEach((listener) => listener()))
    expect(renderDiagram).toHaveBeenLastCalledWith(expect.any(String), true, expect.any(Function))
    expect(container.querySelectorAll('figure')).toHaveLength(1)
    vi.mocked(renderDiagram).mockRejectedValueOnce(new Error('Theme render failed'))
    media.matches = false
    await act(async () => listeners.forEach((listener) => listener()))
    expect(container.querySelector('figure')).toBeNull()
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
    unmount()
    expect(listeners.size).toBe(0)
  })

  it('ignores obsolete theme results and unmounted results', async () => {
    let finish
    vi.mocked(renderDiagram).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const { container, unmount } = render(<MarkdownView content={flow} />)
    media.matches = true
    await act(async () => listeners.forEach((listener) => listener()))
    await act(async () => finish('<svg><text>Old theme</text></svg>'))
    expect(container.querySelector('svg')).toHaveTextContent('Graph')
    vi.mocked(renderDiagram).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    act(() => listeners.forEach((listener) => listener()))
    unmount()
    await act(async () => finish('<svg></svg>'))
    expect(listeners.size).toBe(0)
    expect(container.querySelector('figure')).toBeNull()
  })

  it('does not duplicate diagrams under StrictMode and retains accessible titles', async () => {
    vi.mocked(renderDiagram).mockResolvedValue('<svg aria-labelledby="diagram-title"><title id="diagram-title">Order flow</title></svg>')
    const { container } = render(<StrictMode><MarkdownView content={flow} /></StrictMode>)
    await screen.findByRole('img', { name: 'Order flow' })
    expect(container.querySelectorAll('figure')).toHaveLength(1)
    expect(listeners.size).toBe(1)
  })

  it('does not load Mermaid or listen for theme changes without diagrams', () => {
    render(<MarkdownView content={'# Plain document'} />)
    expect(renderDiagram).not.toHaveBeenCalled()
    expect(window.matchMedia).not.toHaveBeenCalled()
  })
})
