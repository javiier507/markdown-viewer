import { makeFileKey } from './fileKey.js'

export async function readPickedFiles(fileList, allocateId) {
  const picked = Array.from(fileList ?? [])
  if (picked.length === 0) return []

  const results = await Promise.allSettled(
    picked.map(async (file) => ({
      id: allocateId(),
      name: file.name,
      key: makeFileKey(file),
      content: await file.text(),
    })),
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value)
}
