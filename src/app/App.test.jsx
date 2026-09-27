import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

vi.mock('../features/reader/mermaid.js', () => ({
  renderDiagram: vi.fn().mockResolvedValue('<svg viewBox="0 0 400 200"><text>Diagram</text></svg>'),
}))

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
  })

  afterEach(() => {
    delete Element.prototype.scrollIntoView
    vi.unstubAllGlobals()
  })

  it.each([1024, 1025])('applies automatic collapse at a viewport width of %i', async (width) => {
    Element.prototype.scrollIntoView = vi.fn()
    let viewportWidth = width
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: query === '(max-width: 1024px)' && viewportWidth <= 1024,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })))
    const user = userEvent.setup()
    const { container } = render(<App />)
    const input = container.querySelector('input[type="file"]')
    const files = [new File(['# First'], 'first.md'), new File(['# Second'], 'second.md')]
    await user.upload(input, files)
    expect(container.querySelector('.sidebar')).toHaveClass(width <= 1024 ? 'sidebar--collapsed' : 'sidebar')
    if (width > 1024) expect(container.querySelector('.sidebar')).not.toHaveClass('sidebar--collapsed')

    if (width <= 1024) await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    const activeRow = screen.getByRole('button', { name: 'first.md' })
    activeRow.focus()
    await user.click(activeRow)
    expect(screen.getByRole('button', { name: width <= 1024 ? 'Expand sidebar' : 'Collapse sidebar' }))
      .toHaveAttribute('aria-expanded', width <= 1024 ? 'false' : 'true')
    if (width <= 1024) {
      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus()
      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    }

    viewportWidth = 1024
    fireEvent(window, new Event('resize'))
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument()
    await user.upload(input, [files[0]])
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    await user.click(screen.getByRole('button', { name: 'second.md' }))
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    const app = container.querySelector('.app')
    fireEvent.drop(app, { dataTransfer: { types: ['Files'], files: [new File(['image'], 'photo.png')] } })
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument()
    fireEvent.drop(app, { dataTransfer: { types: ['Files'], files: [new File(['# Dropped'], 'drop.md')] } })
    await screen.findByRole('heading', { name: 'Dropped' })
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()
  })

  it('shows the empty state without a sidebar when no file is open', () => {
    const { container } = render(<App />)
    expect(screen.getByRole('button', { name: 'Open File' })).toBeInTheDocument()
    expect(container.querySelector('.sidebar')).toBeNull()
  })

  it('opens selected files and displays the selected document', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    const input = container.querySelector('input[type="file"]')
    const first = new File(['# First document'], 'first.md', { lastModified: 1 })
    const second = new File(['# Second document'], 'second.md', { lastModified: 2 })

    await user.upload(input, [first, second])
    expect(await screen.findByRole('heading', { name: 'First document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'first.md' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'second.md' }))
    expect(screen.getByRole('heading', { name: 'Second document' })).toBeInTheDocument()
  })

  it('toggles the sidebar with Ctrl+B and shares state with the button', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const user = userEvent.setup()
    const { container, unmount } = render(<App />)
    const emptyShortcut = createEvent.keyDown(window, { key: 'b', ctrlKey: true })
    fireEvent(window, emptyShortcut)
    expect(emptyShortcut.defaultPrevented).toBe(false)

    await user.upload(container.querySelector('input[type="file"]'), new File(['# Document'], 'doc.md'))
    const shortcut = createEvent.keyDown(window, { key: 'b', ctrlKey: true })
    fireEvent(window, shortcut)
    expect(shortcut.defaultPrevented).toBe(true)
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    fireEvent.keyDown(window, { key: 'B', ctrlKey: true })
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true')

    unmount()
    const afterUnmount = createEvent.keyDown(window, { key: 'b', ctrlKey: true })
    fireEvent(window, afterUnmount)
    expect(afterUnmount.defaultPrevented).toBe(false)
  })

  it('ignores other keys, modifiers, repeats, handled events and editable targets', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<App />)
    await user.upload(container.querySelector('input[type="file"]'), new File(['# Document'], 'doc.md'))

    for (const options of [
      { ctrlKey: false }, { key: 'a' }, { altKey: true }, { shiftKey: true },
      { metaKey: true }, { repeat: true }, { isComposing: true },
    ]) {
      const event = createEvent.keyDown(window, { key: 'b', ctrlKey: true, ...options })
      fireEvent(window, event)
      expect(event.defaultPrevented).toBe(false)
    }
    const handled = createEvent.keyDown(window, { key: 'b', ctrlKey: true })
    handled.preventDefault()
    fireEvent(window, handled)

    for (const tag of ['input', 'textarea', 'select', 'div']) {
      const editable = document.createElement(tag)
      if (tag === 'div') editable.setAttribute('contenteditable', 'true')
      container.append(editable)
      const event = createEvent.keyDown(editable, { key: 'b', ctrlKey: true })
      fireEvent(editable, event)
      expect(event.defaultPrevented).toBe(false)
      editable.remove()
    }
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens supported dropped files and ignores other files', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    const { container } = render(<App />)
    const app = container.querySelector('.app')
    const markdown = new File(['# Dropped document'], 'dropped.md')
    const other = new File(['data'], 'photo.png')
    const dataTransfer = { types: ['Files'], files: [markdown, other], dropEffect: 'none' }

    fireEvent.dragEnter(app, { dataTransfer })
    expect(screen.getByText('Drop Markdown files to open')).toBeInTheDocument()
    fireEvent.dragOver(app, { dataTransfer })
    expect(dataTransfer.dropEffect).toBe('copy')
    fireEvent.drop(app, { dataTransfer })

    expect(await screen.findByRole('heading', { name: 'Dropped document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'dropped.md' })).toBeInTheDocument()
    expect(screen.queryByText('Drop Markdown files to open')).toBeNull()
    expect(screen.queryByRole('button', { name: 'photo.png' })).toBeNull()
  })

  it('closes the diagram viewer when switching between files with identical content', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    const user = userEvent.setup()
    const { container } = render(<App />)
    const content = '```mermaid\nflowchart LR\nA-->B\n```'
    await user.upload(container.querySelector('input[type="file"]'), [
      new File([content], 'one.md', { lastModified: 1 }),
      new File([content], 'two.md', { lastModified: 2 }),
    ])
    const second = await screen.findByRole('button', { name: 'two.md' })
    await user.click(await screen.findByRole('button', { name: 'Expand diagram' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // Native file events or library state can change while the background is inert.
    fireEvent.click(second)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(await screen.findByRole('button', { name: 'Expand diagram' })).toBeInTheDocument()
  })
})
