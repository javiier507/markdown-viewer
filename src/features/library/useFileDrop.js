import { useRef, useState } from 'react'

const hasFiles = (event) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

export function useFileDrop(onFiles) {
  const [isDragging, setIsDragging] = useState(false)
  const depthRef = useRef(0)

  const onDragEnter = (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    depthRef.current += 1
    setIsDragging(true)
  }

  const onDragOver = (event) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = () => {
    if (depthRef.current === 0) return
    depthRef.current = Math.max(0, depthRef.current - 1)
    if (depthRef.current === 0) setIsDragging(false)
  }

  const onDrop = (event) => {
    if (!hasFiles(event) && !event.dataTransfer?.files?.length) return
    event.preventDefault()
    depthRef.current = 0
    setIsDragging(false)
    onFiles(event.dataTransfer.files)
  }

  return { isDragging, onDragEnter, onDragOver, onDragLeave, onDrop }
}
