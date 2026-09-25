import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFloatingMenu } from './useFloatingMenu.js'

function MenuHarness() {
  const { isOpen, triggerRef, menuRef, openMenu, handleMenuKeyDown } = useFloatingMenu()
  return (
    <>
      <button ref={triggerRef} onClick={openMenu}>Options</button>
      <button>Outside</button>
      {isOpen && (
        <div ref={menuRef} role="menu" onKeyDown={handleMenuKeyDown}>
          <button role="menuitem">First</button>
          <button role="menuitem">Second</button>
        </div>
      )}
    </>
  )
}

describe('useFloatingMenu', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
    vi.stubGlobal('cancelAnimationFrame', clearTimeout)
  })

  it('toggles from the trigger and closes on an outside mousedown', () => {
    render(<MenuHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Options' }))
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('moves focus into the menu, cycles it, and returns it on Escape', async () => {
    render(<MenuHarness />)
    const trigger = screen.getByRole('button', { name: 'Options' })
    fireEvent.click(trigger)
    const first = screen.getByRole('menuitem', { name: 'First' })
    const second = screen.getByRole('menuitem', { name: 'Second' })
    await waitFor(() => expect(first).toHaveFocus())

    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'ArrowDown' })
    expect(first).toHaveFocus()
    fireEvent.keyDown(first, { key: 'ArrowUp' })
    expect(second).toHaveFocus()
    fireEvent.keyDown(second, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
