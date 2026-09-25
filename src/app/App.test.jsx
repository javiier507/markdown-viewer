import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  afterEach(() => {
    delete Element.prototype.scrollIntoView
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
})
