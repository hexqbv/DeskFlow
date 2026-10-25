/**
 * KeyboardShortcutsInfo
 *
 * A small info card that documents DeskFlow's global keyboard shortcuts.
 * Renders in the Overview dashboard so users can discover the shortcuts
 * without digging through settings.
 */
export default function KeyboardShortcutsInfo() {
  const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)
  const mod = isMac ? '⌘ ⇧' : 'Ctrl+Shift'

  const shortcuts = [
    { keys: `${mod} D`, description: 'Show / focus DeskFlow' },
    { keys: `${mod} N`, description: 'Open Quick Note overlay' },
    { keys: `${mod} F`, description: 'Jump to Focus Timer' }
  ]

  return (
    <div className="shortcuts-card">
      <div className="shortcuts-card-header">
        <span className="shortcuts-icon">⌨️</span>
        <span className="shortcuts-card-title">Keyboard Shortcuts</span>
      </div>
      <ul className="shortcuts-list">
        {shortcuts.map(({ keys, description }) => (
          <li key={keys} className="shortcuts-item">
            <kbd className="shortcuts-kbd">{keys}</kbd>
            <span className="shortcuts-desc">{description}</span>
          </li>
        ))}
      </ul>
      <p className="shortcuts-note">
        These are global shortcuts — they work even when DeskFlow is in the background.
      </p>
    </div>
  )
}
