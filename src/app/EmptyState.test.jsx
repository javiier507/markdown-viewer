import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmptyState from './EmptyState.jsx'

describe('EmptyState', () => {
  it('opens the file picker from its call to action', () => {
    const onOpen = vi.fn()
    render(<EmptyState onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open File' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('offers installation only when an install action is available', () => {
    const onInstall = vi.fn()
    const { rerender } = render(<EmptyState onOpen={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument()

    rerender(<EmptyState onOpen={vi.fn()} onInstall={onInstall} />)
    fireEvent.click(screen.getByRole('button', { name: 'Install app' }))
    expect(onInstall).toHaveBeenCalledOnce()
  })
})
