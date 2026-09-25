export default function HiddenFileInput({ ref, onFilesSelected }) {
  const handleChange = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    onFilesSelected(files)
  }

  return (
    <input
      ref={ref}
      type="file"
      accept=".md,.markdown,.mdx,.txt,text/markdown"
      multiple
      onChange={handleChange}
      hidden
    />
  )
}
