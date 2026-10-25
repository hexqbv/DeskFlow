/* eslint-disable react/prop-types */

export default function FocusTimerPreview({
  mode = 'focus',
  status = 'idle',
  formattedTime = '25:00',
  progressPercent = 0,
  completedFocusSessions = 0,
  currentCycleSession = 1,
  pendingTransition = null,
  devFastMode = false,
  onStart = () => {},
  onPause = () => {},
  onResume = () => {},
  onReset = () => {},
  onSwitchMode = () => {},
  onAcceptTransition = () => {},
  onDismissTransition = () => {},
  onToggleDevFastMode = () => {}
}) {
  const isDev = Boolean(import.meta.env.DEV)

  const modeLabels = {
    focus: 'Focus',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  }

  const modeTags = {
    focus: 'Deep Work',
    shortBreak: 'Short Break',
    longBreak: 'Long Break'
  }

  const cycleIndex = completedFocusSessions % 4

  return (
    <div className="card timer-card">
      <div className="card-header" style={{ width: '100%', marginBottom: 10 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDev && (
            <button
              type="button"
              className={`dev-fast-toggle-pill ${devFastMode ? 'active' : ''}`}
              onClick={onToggleDevFastMode}
              title="Development only: Toggle 10s fast countdown for instant testing"
            >
              ⚡ {devFastMode ? '10s Mode' : 'Normal'}
            </button>
          )}
          <span
            className={`card-tag ${mode === 'shortBreak' ? 'emerald' : mode === 'longBreak' ? 'amber' : ''}`}
          >
            {modeTags[mode]}
          </span>
        </div>
      </div>

      {/* Cycle Session Dots (1 to 4) */}
      <div className="timer-intervals">
        {[0, 1, 2, 3].map((idx) => {
          let dotClass = 'interval-dot'
          if (idx < cycleIndex) {
            dotClass += ' completed'
          } else if (idx === cycleIndex && mode === 'focus') {
            dotClass += status === 'running' ? ' active pulsing' : ' active'
          }
          return (
            <span
              key={idx}
              className={dotClass}
              title={`Session ${idx + 1} of 4${idx < cycleIndex ? ' (Completed)' : ''}`}
            ></span>
          )
        })}
      </div>

      {/* Timer Digits & Progress Indicator */}
      <div className="timer-display-container">
        <div className="timer-digits">{formattedTime}</div>

        <div className="timer-progress-track">
          <div
            className={`timer-progress-fill ${mode}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p className="timer-subtitle">
          {mode === 'focus' &&
            `Session ${currentCycleSession} of 4 • ${status === 'running' ? 'Focusing...' : status === 'paused' ? 'Paused' : 'Deep Focus Interval'}`}
          {mode === 'shortBreak' &&
            `Short Break • ${status === 'running' ? 'Recharging...' : status === 'paused' ? 'Paused' : 'Take a breather'}`}
          {mode === 'longBreak' &&
            `Long Break • ${status === 'running' ? 'Resting...' : status === 'paused' ? 'Paused' : 'Extended recovery'}`}
        </p>
      </div>

      {/* Mode Presets */}
      <div className="timer-presets">
        <button
          type="button"
          className={`preset-pill ${mode === 'focus' ? 'active' : ''}`}
          onClick={() => onSwitchMode('focus')}
        >
          Focus {devFastMode ? '(10s)' : '(25m)'}
        </button>
        <button
          type="button"
          className={`preset-pill ${mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => onSwitchMode('shortBreak')}
        >
          Short Break {devFastMode ? '(5s)' : '(5m)'}
        </button>
        <button
          type="button"
          className={`preset-pill ${mode === 'longBreak' ? 'active' : ''}`}
          onClick={() => onSwitchMode('longBreak')}
        >
          Long Break {devFastMode ? '(8s)' : '(15m)'}
        </button>
      </div>

      {/* Session Completion Transition Card */}
      {pendingTransition ? (
        <div className="timer-transition-card">
          <div className="transition-header">
            <span className="transition-icon">
              {pendingTransition.type === 'focusCompleted'
                ? pendingTransition.cycleCompleted
                  ? '🏆'
                  : '🎉'
                : '☕'}
            </span>
            <div className="transition-text-group">
              <span className="transition-title">
                {pendingTransition.type === 'focusCompleted'
                  ? pendingTransition.cycleCompleted
                    ? '4-Session Cycle Complete!'
                    : 'Focus Session Finished!'
                  : 'Break Finished!'}
              </span>
              <span className="transition-message">{pendingTransition.message}</span>
            </div>
          </div>
          <div className="transition-actions">
            <button
              type="button"
              className="btn-primary transition-start-btn"
              onClick={onAcceptTransition}
            >
              Start {modeLabels[pendingTransition.suggestedMode]}
            </button>
            <button
              type="button"
              className="btn-secondary transition-dismiss-btn"
              onClick={onDismissTransition}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        /* Timer Action Controls */
        <div className="timer-actions">
          {status === 'idle' && (
            <button type="button" className="btn-primary" onClick={onStart}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Start {modeLabels[mode]}</span>
            </button>
          )}

          {status === 'running' && (
            <div className="timer-dual-buttons">
              <button type="button" className="btn-primary btn-pause" onClick={onPause}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                <span>Pause</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onReset}
                title="Reset session to start"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          )}

          {status === 'paused' && (
            <div className="timer-dual-buttons">
              <button type="button" className="btn-primary" onClick={onResume}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Resume</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onReset}
                title="Reset session to start"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
