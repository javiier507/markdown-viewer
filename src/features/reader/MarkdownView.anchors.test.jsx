import { StrictMode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownView from './MarkdownView.jsx'

let scrollIntoView
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
beforeEach(() => {
  scrollIntoView = vi.fn()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
})
afterEach(() => {
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll)
  else delete HTMLElement.prototype.scrollIntoView
})

describe('document anchor navigation', () => {
  it('follows a nested link label, focuses the heading and leaves the URL unchanged', () => {
    const url = window.location.href
    render(<MarkdownView content={'[**Jump**](#details)\n\n## Details'} />)
    const target = screen.getByRole('heading', { name: 'Details' })
    const focus = vi.spyOn(target, 'focus')
    expect(fireEvent.click(screen.getByText('Jump'))).toBe(false)
    expect(target).toHaveFocus()
    expect(target).toHaveAttribute('tabindex', '-1')
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(scrollIntoView.mock.instances).toEqual([target])
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start', inline: 'nearest' })
    expect(window.location.href).toBe(url)
  })

  it('supports keyboard activation and percent-encoded Unicode fragments', async () => {
    const user = userEvent.setup()
    render(<MarkdownView content={'[Jump](#instalaci%C3%B3n-r%C3%A1pida)\n\n## Instalación rápida'} />)
    await user.tab()
    expect(screen.getByRole('link', { name: 'Jump' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading')).toHaveFocus()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it.each(['<a id="custom"></a>', '<a name="custom"></a>', '<div id="custom" tabindex="0">Target</div>'])(
    'supports explicit HTML destinations: %s', (destination) => {
      const { container } = render(<MarkdownView content={'[Jump](#custom)\n\n' + destination} />)
      fireEvent.click(screen.getByRole('link', { name: 'Jump' }))
      const target = container.querySelector('[id="custom"], a[name="custom"]')
      expect(target).toHaveFocus()
      expect(scrollIntoView.mock.instances).toEqual([target])
      if (target.tagName === 'DIV') expect(target).toHaveAttribute('tabindex', '0')
    })

  it('uses the first matching destination and treats special characters as literal IDs', () => {
    const { container } = render(<MarkdownView content={'[Jump](#a%3Ab)\n\n<a name="a:b"></a><div id="a:b">Second</div>'} />)
    fireEvent.click(screen.getByRole('link'))
    expect(container.querySelector('a[name]')).toHaveFocus()
  })

  it.each(['#missing', '#outside', '#%E0%A4%A'])(
    'ignores missing, outside or malformed destinations: %s', (href) => {
      const { container } = render(<><div id="outside">Chrome</div><MarkdownView content={`[Jump](${href})`} /></>)
      const link = screen.getByRole('link')
      link.focus()
      expect(fireEvent.click(link)).toBe(false)
      expect(link).toHaveFocus()
      expect(scrollIntoView).not.toHaveBeenCalled()
      expect(container.querySelector('#outside')).not.toHaveAttribute('tabindex')
    })

  it('jumps to the document beginning for an empty fragment', () => {
    const { container } = render(<MarkdownView content={'[Top](#)\n\n# Title'} />)
    fireEvent.click(screen.getByRole('link'))
    expect(container.querySelector('.prose__body')).toHaveFocus()
    expect(scrollIntoView.mock.instances).toEqual([container.querySelector('.prose__body')])
  })

  it('leaves external and other-file link events untouched', () => {
    const { container } = render(<MarkdownView content={'[Web](https://example.com)\n\n[File](other.md#details)'} />)
    for (const link of container.querySelectorAll('a')) {
      // Observe cancellation without triggering jsdom's unsupported navigation.
      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      container.addEventListener('click', (observed) => {
        expect(observed.defaultPrevented).toBe(false)
        observed.preventDefault()
      }, { once: true })
      link.dispatchEvent(event)
    }
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('cleans up listeners and focus attributes across rerenders and unmounting', () => {
    const first = '[Jump](#first)\n\n## First'
    const { rerender, unmount } = render(<StrictMode><MarkdownView content={first} /></StrictMode>)
    const oldLink = screen.getByRole('link')
    const oldHeading = screen.getByRole('heading')
    fireEvent.click(oldLink)
    rerender(<StrictMode><MarkdownView content={first} /></StrictMode>)
    fireEvent.click(oldLink)
    expect(scrollIntoView).toHaveBeenCalledTimes(2)
    rerender(<StrictMode><MarkdownView content={'[Jump](#second)\n\n## Second'} /></StrictMode>)
    expect(oldHeading).not.toHaveAttribute('tabindex')
    fireEvent.click(screen.getByRole('link'))
    expect(screen.getByRole('heading', { name: 'Second' })).toHaveFocus()
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
    const newLink = screen.getByRole('link')
    const newHeading = screen.getByRole('heading')
    unmount()
    expect(newHeading).not.toHaveAttribute('tabindex')
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    newLink.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(scrollIntoView).toHaveBeenCalledTimes(3)
  })
})
