import { useMemo, useRef, useState } from 'react'
import { readPickedFiles } from '../lib/readPickedFiles.js'

export function useOpenFiles() {
  const [files, setFiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const nextIdRef = useRef(1)

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeId) ?? null,
    [files, activeId],
  )

  const addFiles = async (fileList) => {
    const loaded = await readPickedFiles(fileList, () => nextIdRef.current++)
    if (loaded.length === 0) return

    const existingKeys = new Map(files.map((f) => [f.key, f.id]))
    const additions = []
    let firstId = null
    for (const file of loaded) {
      const existingId = existingKeys.get(file.key)
      if (existingId != null) {
        if (firstId == null) firstId = existingId
      } else {
        additions.push(file)
        existingKeys.set(file.key, file.id)
        if (firstId == null) firstId = file.id
      }
    }

    if (firstId != null) setActiveId(firstId)
    if (additions.length > 0) setFiles((prev) => [...prev, ...additions])
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
  }

  const selectFile = (id) => setActiveId(id)

  return { files, activeId, activeFile, addFiles, removeFile, selectFile }
}
