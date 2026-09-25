import { render, screen } from '@testing-library/react'
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
})
