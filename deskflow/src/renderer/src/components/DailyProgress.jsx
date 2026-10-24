/* eslint-disable react/prop-types */
export default function DailyProgress({ tasks = [] }) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length

  // Calculate percentage dynamically based on task completion
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="card progress-card">
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="card-title">Daily Progress</span>
        </div>
        <span className="card-tag">
          {totalTasks === 0 ? '0% Started' : `${progressPercent}% Achieved`}
        </span>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="progress-stats-grid">
        <div className="stat-box">
          <span className="stat-label">Focus</span>
          <span className="stat-value">50m</span>
          <span className="stat-subtext">Goal: 120m</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Tasks</span>
          <span className="stat-value">
            {completedTasks} / {totalTasks}
          </span>
          <span className="stat-subtext">Completed</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Streak</span>
          <span className="stat-value">3 Days</span>
          <span className="stat-subtext">Consistency</span>
        </div>
      </div>
    </div>
  )
}
