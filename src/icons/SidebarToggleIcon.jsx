export default function SidebarToggleIcon({ isCollapsed }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={isCollapsed ? 'M6 3.5L10.5 8 6 12.5' : 'M10 3.5L5.5 8l4.5 4.5'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
