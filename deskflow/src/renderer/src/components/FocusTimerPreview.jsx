export default function FocusTimerPreview() {
  return (
    <div className="card timer-card">
      <div className="card-header" style={{ width: '100%', marginBottom: 12 }}>
        <div className="card-title-group">
          <svg
            className="card-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="card-title">Focus Timer</span>
        </div>
        <span className="card-tag">Pomodoro</span>
      </div>

      <div className="timer-intervals">
        <span className="interval-dot active" title="Session 1"></span>
        <span className="interval-dot" title="Session 2"></span>
        <span className="interval-dot" title="Session 3"></span>
        <span className="interval-dot" title="Session 4"></span>
      </div>

      <div className="timer-display-container">
        <div className="timer-digits">25:00</div>
        <p className="timer-subtitle">Deep Focus Interval • Session 1 of 4</p>
      </div>

      <div className="timer-presets">
        <span className="preset-pill active">25m Focus</span>
        <span className="preset-pill">5m Short Break</span>
        <span className="preset-pill">15m Long Break</span>
      </div>

      <div className="timer-actions">
        <button type="button" className="btn-primary disabled" disabled aria-disabled="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>Start Focus</span>
        </button>
        <span className="timer-disabled-note">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Interactive timer arrives in Milestone 2
        </span>
      </div>
    </div>
  )
}
