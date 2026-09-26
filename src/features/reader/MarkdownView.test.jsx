import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MarkdownView from './MarkdownView.jsx'

describe('MarkdownView', () => {
  it('renders sanitized Markdown and adds one copy button per code block', () => {
    const content = '# Safe\n\n<script>alert(1)</script>\n\n```js\nconst x = 1\n```\n\n```txt\nsecond\n```'
    const { container, rerender } = render(<MarkdownView content={content} />)

    expect(screen.getByRole('heading', { name: 'Safe' })).toBeInTheDocument()
    expect(container.querySelector('.prose__body script')).toBeNull()
    expect(container.querySelectorAll('.prose__body pre')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(2)

    rerender(<MarkdownView content={content} />)
    expect(screen.getAllByRole('button', { name: 'Copy code' })).toHaveLength(2)
  })

  it('copies source text and restores the button after two seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    vi.useFakeTimers()
    render(<MarkdownView content={'```js\nconst x = 1\n```'} />)
    const button = screen.getByRole('button', { name: 'Copy code' })

    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })
    expect(writeText).toHaveBeenCalledWith('const x = 1\n')
    expect(button).toHaveClass('code-copy--copied')

    act(() => vi.advanceTimersByTime(2000))
    expect(button).not.toHaveClass('code-copy--copied')
  })

  it('does not mount dangerous content from Markdown', () => {
    const { container } = render(<MarkdownView content={'<img src=x onerror="alert(1)">\n\n<form><input></form>'} />)
    expect(container.querySelector('img')).not.toHaveAttribute('onerror')
    expect(container.querySelector('form, input')).toBeNull()
  })
})
