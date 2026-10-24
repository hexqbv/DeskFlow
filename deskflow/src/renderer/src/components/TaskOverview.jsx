/* eslint-disable react/prop-types */
import { useState } from 'react'

export default function TaskOverview({
  tasks = [],
  onAddTask = () => {},
  onToggleTask = () => {},
  onDeleteTask = () => {}
}) {
  const [filter, setFilter] = useState('all')
  const [titleInput, setTitleInput] = useState('')

  const totalCount = tasks.length
  const completedCount = tasks.filter((t) => t.completed).length
  const pendingCount = totalCount - completedCount

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = titleInput.trim()
    if (!trimmed) return
    onAddTask(trimmed)
    setTitleInput('')
  }

  return (
    <div className="card task-card">
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
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span className="card-title">Tasks Overview</span>
        </div>
        <span className="card-tag">
          {pendingCount === 0 && totalCount > 0 ? 'All caught up' : `${pendingCount} Pending`}
        </span>
      </div>

      <div className="task-filter-group">
        <button
          type="button"
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          className={`filter-pill ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Add Task Input Form */}
      <form className="task-add-form" onSubmit={handleSubmit}>
        <div className="task-add-input-wrapper">
          <svg
            className="task-add-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <input
            type="text"
            className="task-add-input"
            placeholder="Add a new task and press Enter..."
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
        </div>
        <button type="submit" className="task-add-submit-btn" disabled={!titleInput.trim()}>
          Add Task
        </button>
      </form>

      {/* Task List or Empty State */}
      <div className="task-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <div className="task-left">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.completed}
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                  title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.completed && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="task-title-group">
                  <span
                    className="task-title"
                    onClick={() => onToggleTask(task.id)}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                  <div className="task-meta">
                    <span
                      className={`task-priority-indicator priority-${task.priority || 'medium'}`}
                      title={`Priority: ${task.priority || 'medium'}`}
                    ></span>
                    <span className="task-meta-text">{task.completed ? 'Completed' : 'To-do'}</span>
                  </div>
                </div>
              </div>

              <div className="task-right">
                {task.tag && (
                  <span className={`task-tag ${task.completed ? '' : 'indigo'}`}>{task.tag}</span>
                )}
                <button
                  type="button"
                  className="task-delete-btn"
                  title="Delete task"
                  aria-label="Delete task"
                  onClick={() => onDeleteTask(task.id)}
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
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="task-empty-state">
            <div className="empty-icon-wrapper">
              {filter === 'completed' ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <p className="empty-title">
              {totalCount === 0
                ? 'No tasks yet'
                : filter === 'pending'
                  ? 'All tasks completed'
                  : 'No completed tasks'}
            </p>
            <p className="empty-subtitle">
              {totalCount === 0
                ? 'Add your first task above to start planning your flow.'
                : filter === 'pending'
                  ? 'Great job! You have cleared your pending tasks.'
                  : 'Complete a task to review your achievements here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
