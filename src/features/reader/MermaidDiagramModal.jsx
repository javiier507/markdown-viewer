import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '../../shared/ui/icons/CloseIcon.jsx'
import { renderDiagram } from './mermaid.js'
import { diagramSize, fitView, resizeView, zoomView } from './diagramViewport.js'
import './diagram-modal.css'

export default function MermaidDiagramModal({ source, onClose, returnFocus }) {
  const titleId = useId()
  const hintId = useId()
  const overlayRef = useRef(null)
  const canvasRef = useRef(null)
  const closeRef = useRef(null)
  const dragRef = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [model, setModel] = useState({ status: 'loading', svg: '', width: 1, height: 1,
    viewport: { width: 1, height: 1 }, view: { scale: 1, x: 0, y: 0, fitted: true } })
  const [dragging, setDragging] = useState(false)
  const markup = useMemo(() => ({ __html: model.svg }), [model.svg])

  useEffect(() => {
    const overlay = overlayRef.current
    const siblings = [...document.body.children].filter((node) => node !== overlay && !['SCRIPT', 'STYLE'].includes(node.tagName))
    const attributes = siblings.map((node) => [node, node.getAttribute('inert'), node.getAttribute('aria-hidden')])
    attributes.forEach(([node]) => { node.setAttribute('inert', ''); node.setAttribute('aria-hidden', 'true') })
    const scrollNodes = [document.body, ...document.querySelectorAll('.content')]
    const overflow = scrollNodes.map((node) => [node, node.style.overflow])
    overflow.forEach(([node]) => { node.style.overflow = 'hidden' })
    closeRef.current.focus({ preventScroll: true })

    const focusables = () => [...overlay.querySelectorAll('button:not(:disabled), [tabindex="0"]')]
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); return }
      if (event.key !== 'Tab') return
      const elements = focusables()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    const focusin = (event) => {
      if (!overlay.contains(event.target)) closeRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focusin)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      document.removeEventListener('focusin', focusin)
      attributes.forEach(([node, inert, hidden]) => {
        if (inert === null) node.removeAttribute('inert'); else node.setAttribute('inert', inert)
        if (hidden === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', hidden)
      })
      overflow.forEach(([node, value]) => { node.style.overflow = value })
      const trigger = returnFocus()
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [onClose, returnFocus])

  useEffect(() => {
    const canvas = canvasRef.current
    const measure = () => {
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      setModel((previous) => {
        const viewport = { width, height }
        return { ...previous, viewport, view: resizeView(previous.view, previous, previous.viewport, viewport) }
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    const wheel = (event) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1
      const factor = Math.exp(Math.max(-1, Math.min(1, -event.deltaY * unit * 0.002)))
      setModel((previous) => previous.status !== 'ready' ? previous : ({ ...previous,
        view: zoomView(previous.view, factor, { x: event.clientX - rect.left, y: event.clientY - rect.top },
          Math.min(0.1, fitView(previous, previous.viewport).scale)) }))
    }
    canvas.addEventListener('wheel', wheel, { passive: false })
    return () => {
      observer.disconnect()
      canvas.removeEventListener('wheel', wheel)
      if (dragRef.current && canvas.hasPointerCapture?.(dragRef.current.id)) {
        canvas.releasePointerCapture(dragRef.current.id)
      }
      dragRef.current = null
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    let active = true
    let generation = 0
    const render = () => {
      const current = ++generation
      const isCurrent = () => active && current === generation
      renderDiagram(source, media.matches, isCurrent).then((svg) => {
        if (!svg || !isCurrent()) return
        const template = document.createElement('template')
        template.innerHTML = svg
        const size = diagramSize(template.content.querySelector('svg'))
        setModel((previous) => ({ ...previous, ...size, svg, status: 'ready',
          view: previous.svg ? previous.view : fitView(size, previous.viewport) }))
      }).catch(() => {
        if (isCurrent()) setModel((previous) => ({ ...previous, status: 'error' }))
      })
    }
    render()
    media.addEventListener('change', render)
    return () => { active = false; media.removeEventListener('change', render) }
  }, [source, attempt])

  const zoom = (factor) => setModel((previous) => ({ ...previous,
    view: zoomView(previous.view, factor, { x: previous.viewport.width / 2, y: previous.viewport.height / 2 },
      Math.min(0.1, fitView(previous, previous.viewport).scale)) }))
  const fit = () => setModel((previous) => ({ ...previous, view: fitView(previous, previous.viewport) }))
  const actualSize = () => setModel((previous) => ({ ...previous,
    view: { scale: 1, x: (previous.viewport.width - previous.width) / 2,
      y: (previous.viewport.height - previous.height) / 2, fitted: false } }))
  const pan = (x, y) => setModel((previous) => ({ ...previous,
    view: { ...previous.view, x: previous.view.x + x, y: previous.view.y + y, fitted: false } }))
  const endDrag = (event) => {
    if (!dragRef.current || event.pointerId !== dragRef.current.id) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }
  const minimum = Math.min(0.1, fitView(model, model.viewport).scale)
  const ready = model.status === 'ready'

  return createPortal(
    <div ref={overlayRef} className="diagram-modal__backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="diagram-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="diagram-modal__header">
          <h2 id={titleId}>Mermaid diagram</h2>
          <button ref={closeRef} className="btn diagram-modal__icon" aria-label="Close diagram" title="Close diagram (Escape)" onClick={onClose}><CloseIcon /></button>
        </header>
        <div className="diagram-modal__toolbar" role="group" aria-label="Diagram controls">
          <button className="btn diagram-modal__icon" aria-label="Zoom out" title="Zoom out (-)" disabled={!ready || model.view.scale <= minimum} onClick={() => zoom(1 / 1.2)}>−</button>
          <output className="diagram-modal__zoom" aria-label="Zoom level">{Math.round(model.view.scale * 100)}%</output>
          <button className="btn diagram-modal__icon" aria-label="Zoom in" title="Zoom in (+)" disabled={!ready || model.view.scale >= 8} onClick={() => zoom(1.2)}>+</button>
          <span className="diagram-modal__separator" aria-hidden="true" />
          <button className="btn diagram-modal__action" disabled={!ready} onClick={fit} title="Fit to view (0)">Fit to view</button>
          <button className="btn diagram-modal__action" disabled={!ready} onClick={actualSize} title="Actual size (1)">Actual size</button>
        </div>
        <div ref={canvasRef} className={`diagram-modal__canvas${dragging ? ' diagram-modal__canvas--dragging' : ''}`}
          tabIndex={0} role="region" aria-label="Diagram canvas" aria-describedby={hintId} aria-busy={model.status === 'loading'}
          onKeyDown={(event) => {
            if (!ready || event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey) return
            const amount = event.shiftKey ? 120 : 40
            const actions = { ArrowLeft: () => pan(-amount, 0), ArrowRight: () => pan(amount, 0),
              ArrowUp: () => pan(0, -amount), ArrowDown: () => pan(0, amount),
              '+': () => zoom(1.2), '=': () => zoom(1.2), '-': () => zoom(1 / 1.2), '0': fit, '1': actualSize }
            if (actions[event.key]) { event.preventDefault(); actions[event.key]() }
          }}
          onPointerDown={(event) => {
            if (!ready || event.button !== 0 || dragRef.current) return
            event.preventDefault()
            event.currentTarget.focus({ preventScroll: true })
            event.currentTarget.setPointerCapture(event.pointerId)
            dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
            setDragging(true)
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current
            if (!drag || event.pointerId !== drag.id) return
            pan(event.clientX - drag.x, event.clientY - drag.y)
            drag.x = event.clientX; drag.y = event.clientY
          }}
          onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
          {ready && <div className="diagram-modal__graphic" style={{ width: model.width, height: model.height,
            transform: `translate(${model.view.x}px, ${model.view.y}px) scale(${model.view.scale})` }}
            dangerouslySetInnerHTML={markup} />}
          {model.status === 'loading' && <p className="diagram-modal__status" role="status">Loading diagram…</p>}
          {model.status === 'error' && <div className="diagram-modal__status" role="alert">
            <p>Could not render this diagram.</p>
            <button className="btn diagram-modal__action" onClick={() => {
              setModel((previous) => ({ ...previous, status: 'loading' }))
              setAttempt((previous) => previous + 1)
            }}>Retry</button>
          </div>}
        </div>
        <p id={hintId} className="diagram-modal__hint">Drag to move · Scroll to zoom · Arrow keys to move · 0 to fit</p>
      </section>
    </div>, document.body,
  )
}
