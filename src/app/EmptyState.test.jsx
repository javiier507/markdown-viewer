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
})
