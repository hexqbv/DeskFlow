/* eslint-disable react/prop-types */
import FocusTimerPreview from './FocusTimerPreview'

export default function FocusView({ timer, tasks = [], onToggleTask = () => {} }) {
  const pendingTasks = tasks.filter((t) => !t.completed)

  return (
    <div className="focus-view-container">
      <div className="focus-view-main">
        <FocusTimerPreview
          mode={timer.mode}
          status={timer.status}
          formattedTime={timer.formattedTime}
          progressPercent={timer.progressPercent}
          completedFocusSessions={timer.completedFocusSessions}
          currentCycleSession={timer.currentCycleSession}
          pendingTransition={timer.pendingTransition}
          devFastMode={timer.devFastMode}
          onStart={timer.startTimer}
          onPause={timer.pauseTimer}
          onResume={timer.resumeTimer}
          onReset={timer.resetTimer}
          onSwitchMode={timer.switchMode}
          onAcceptTransition={timer.acceptTransition}
          onDismissTransition={timer.dismissTransition}
          onToggleDevFastMode={timer.toggleDevFastMode}
        />

        {/* Task Focus Companion Strip */}
        <div className="card focus-task-companion">
          <div className="card-header">
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
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="card-title">Session Focus Intent</span>
            </div>
            <span className="card-tag">
              {pendingTasks.length > 0 ? `${pendingTasks.length} Pending` : 'All Done'}
            </span>
          </div>

          <p className="focus-companion-subtitle">
            Choose what you are working on during this interval:
          </p>

          <div className="focus-companion-task-list">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="focus-companion-task-item"
                  onClick={() => onToggleTask(task.id)}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    className="task-checkbox"
                    title="Mark completed"
                  ></button>
                  <span className="focus-task-title">{task.title}</span>
                  {task.tag && <span className="task-tag indigo">{task.tag}</span>}
                </div>
              ))
            ) : (
              <div className="focus-empty-tasks">
                <span>✨ No pending tasks! You are free to focus on open-ended work.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
