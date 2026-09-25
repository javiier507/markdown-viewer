import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Sidebar from './Sidebar.jsx'

const files = [
  { id: 1, name: 'one.md', content: 'one' },
  { id: 2, name: 'two.md', content: 'two' },
]

describe('Sidebar', () => {
  it('renders files, marks the active item and toggles collapse', () => {
    const onToggleCollapse = vi.fn()
    const { container, rerender } = render(
      <Sidebar files={files} activeId={2} activeItemRef={null} isCollapsed={false}
        onAdd={vi.fn()} onSelect={vi.fn()} onRemove={vi.fn()}
        onToggleCollapse={onToggleCollapse} />,
    )

    expect(screen.getByRole('button', { name: 'one.md' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'two.md' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'two.md' }).closest('li')).toHaveClass('file-item--active')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))
    expect(onToggleCollapse).toHaveBeenCalledOnce()

    rerender(
      <Sidebar files={files} activeId={2} activeItemRef={null} isCollapsed={true}
        onAdd={vi.fn()} onSelect={vi.fn()} onRemove={vi.fn()}
        onToggleCollapse={onToggleCollapse} />,
    )
    expect(container.querySelector('#sidebar-content')).toHaveAttribute('hidden')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
  })
})
