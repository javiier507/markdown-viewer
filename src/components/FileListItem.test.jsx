import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FileListItem from './FileListItem.jsx'

const file = { id: 3, name: 'notes.md', content: '# Notes' }

describe('FileListItem', () => {
  it('selects the file from its main button', () => {
    const onSelect = vi.fn()
    render(<FileListItem file={file} isActive={false} onSelect={onSelect} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'notes.md' }))
    expect(onSelect).toHaveBeenCalledWith(3)
  })

  it('opens a portal menu and removes the file', () => {
    const onRemove = vi.fn()
    render(<FileListItem file={file} isActive={true} onSelect={vi.fn()} onRemove={onRemove} />)
    const options = screen.getByRole('button', { name: 'Options for notes.md' })
    expect(options).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(options)
    expect(options).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove file' }))

    expect(onRemove).toHaveBeenCalledWith(3)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
