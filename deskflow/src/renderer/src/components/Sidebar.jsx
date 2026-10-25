/* eslint-disable react/prop-types */
export default function Sidebar({
  activeTab = 'overview',
  onSelectTab = () => {},
  pendingTasksCount = 0,
  focusBadge = '25m',
  notesCount = 0
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      badge: null,
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'tasks',
      label: 'Tasks',
      badge: pendingTasksCount > 0 ? String(pendingTasksCount) : null,
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    },
    {
      id: 'focus',
      label: 'Focus',
      badge: focusBadge,
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'notes',
      label: 'Notes',
      badge: notesCount > 0 ? String(notesCount) : null,
      icon: (
        <svg
          className="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    }
  ]

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">
            <svg
              className="brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="brand-info">
            <span className="brand-name">DeskFlow</span>
            <span className="brand-tag">Workspace</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <span className="nav-section-title">Navigation</span>
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectTab(item.id)}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-pill">
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>DeskFlow Desktop</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}
