import { useMemo, useRef, useState } from 'react'
import { readPickedFiles } from '../lib/readPickedFiles.js'
import { makePathKey } from '../lib/fileKey.js'

export function useOpenFiles() {
  const [files, setFiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const nextIdRef = useRef(1)
  // Stable ref so async callbacks always read the latest files without stale closures
  const filesRef = useRef(files)
  filesRef.current = files

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeId) ?? null,
    [files, activeId],
  )

  const addFiles = async (fileList) => {
    const loaded = await readPickedFiles(fileList, () => nextIdRef.current++)
    if (loaded.length === 0) return

    const existingKeys = new Map(filesRef.current.map((f) => [f.key, f.id]))
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

  const addFileFromPath = ({ path, name, content }) => {
    const key = makePathKey(path)
    const existing = filesRef.current.find((f) => f.key === key)
    if (existing) {
      setActiveId(existing.id)
      return
    }
    const id = nextIdRef.current++
    setActiveId(id)
    setFiles((prev) => [...prev, { id, name, key, content }])
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
  }

  const selectFile = (id) => setActiveId(id)

  return {
    files,
    activeId,
    activeFile,
    addFiles,
    addFileFromPath,
    removeFile,
    selectFile,
  }
}
