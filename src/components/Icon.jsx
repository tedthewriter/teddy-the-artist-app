const icons = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  thought: '<path d="M8 18h8M9 22h6M8.7 14.6A7 7 0 1 1 16 14.6c-.8.6-1 1.2-1 2.4H10c0-1.2-.4-1.8-1.3-2.4Z"/>',
  spark: '<path d="m12 3 1.2 4.1a5.2 5.2 0 0 0 3.6 3.6L21 12l-4.2 1.3a5.2 5.2 0 0 0-3.6 3.6L12 21l-1.2-4.1a5.2 5.2 0 0 0-3.6-3.6L3 12l4.2-1.3a5.2 5.2 0 0 0 3.6-3.6L12 3Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  toolbox: '<path d="M9 6V4h6v2M4 8h16v11H4zM4 12h16M10 11h4v3h-4z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4.2A4.8 4.8 0 0 0 21 8.2C21 5.3 16.9 3 12 3Z"/><circle cx="7.5" cy="9" r=".8"/><circle cx="10" cy="6.5" r=".8"/><circle cx="14" cy="6.5" r=".8"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  journal: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Zm2 0v16M10 8h6M10 12h6"/>',
  people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 4.5"/>',
  game: '<path d="M7 8h10a4 4 0 0 1 3.8 5.2l-1.3 4A2.5 2.5 0 0 1 15.4 18l-1.1-1H9.7l-1.1 1a2.5 2.5 0 0 1-4.1-.8l-1.3-4A4 4 0 0 1 7 8Z"/><path d="M8 11v4M6 13h4M16 12h.01M18 14h.01"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r=".8"/><circle cx="15" cy="9" r=".8"/><circle cx="12" cy="12" r=".8"/><circle cx="9" cy="15" r=".8"/><circle cx="15" cy="15" r=".8"/>',
  play: '<path d="m9 7 8 5-8 5V7Z"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
}

export default function Icon({ name, size = 22 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: icons[name] || icons.spark }}
    />
  )
}
