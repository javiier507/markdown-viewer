import { useEffect, useRef } from 'react'

export function useScrollActiveIntoView(activeId) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  return ref
}
