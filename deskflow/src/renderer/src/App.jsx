import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import FocusTimerPreview from './components/FocusTimerPreview'
import DailyProgress from './components/DailyProgress'
import TaskOverview from './components/TaskOverview'
import FocusView from './components/FocusView'
import { usePomodoro } from './hooks/usePomodoro'

const LOCAL_STORAGE_KEY = 'deskflow_tasks_fallback'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // Initialize shared Pomodoro timer
  const timer = usePomodoro()

  // Load tasks on mount
  useEffect(() => {
    let isMounted = true

    const loadInitialTasks = async () => {
      try {
        if (window.api && typeof window.api.getTasks === 'function') {
          const stored = await window.api.getTasks()
          if (isMounted) {
            setTasks(Array.isArray(stored) ? stored : [])
          }
        } else {
          await Promise.resolve()
          const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
          if (cached) {
            if (isMounted) setTasks(JSON.parse(cached))
          } else {
            const starterTasks = [
              {
                id: 'task_starter_1',
                title: 'Explore DeskFlow workspace dashboard',
                completed: true,
                createdAt: new Date().toISOString(),
                priority: 'high',
                tag: 'Milestone 1'
              },
              {
                id: 'task_starter_2',
                title: 'Try checking off or adding a new task',
                completed: false,
                createdAt: new Date().toISOString(),
                priority: 'high',
                tag: 'Milestone 2'
              }
            ]
            if (isMounted) {
              setTasks(starterTasks)
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(starterTasks))
            }
          }
        }
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialTasks()

    return () => {
      isMounted = false
    }
  }, [])

  // Add Task
  const handleAddTask = async (title) => {
    if (!title || !title.trim()) return

    try {
      if (window.api && typeof window.api.addTask === 'function') {
        const updated = await window.api.addTask(title.trim())
        setTasks(updated)
      } else {
        const newTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: title.trim(),
          completed: false,
          createdAt: new Date().toISOString(),
          priority: 'medium',
          tag: 'Task'
        }
        const updated = [newTask, ...tasks]
        setTasks(updated)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  // Toggle Task Completion
  const handleToggleTask = async (id) => {
    try {
      if (window.api && typeof window.api.toggleTask === 'function') {
        const updated = await window.api.toggleTask(id)
        setTasks(updated)
      } else {
        const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        setTasks(updated)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  // Delete Task
  const handleDeleteTask = async (id) => {
    try {
      if (window.api && typeof window.api.deleteTask === 'function') {
        const updated = await window.api.deleteTask(id)
        setTasks(updated)
      } else {
        const updated = tasks.filter((t) => t.id !== id)
        setTasks(updated)
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const pendingCount = tasks.filter((t) => !t.completed).length

  // Live sidebar focus badge (displays MM:SS while active, or mode duration)
  const focusBadge =
    timer.status === 'running'
      ? timer.formattedTime
      : timer.mode === 'focus'
        ? timer.devFastMode
          ? '10s'
          : '25m'
        : timer.mode === 'shortBreak'
          ? timer.devFastMode
            ? '5s'
            : '5m'
          : timer.devFastMode
            ? '8s'
            : '15m'

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingTasksCount={pendingCount}
        focusBadge={focusBadge}
      />

      <main className="main-wrapper">
        <div className="main-content">
          <Header />

          {/* Overview Dashboard View */}
          {activeTab === 'overview' && (
            <div className="dashboard-grid">
              <div className="column-left">
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
                <DailyProgress
                  tasks={tasks}
                  completedFocusSessions={timer.completedFocusSessions}
                />
              </div>

              <div className="column-right">
                <TaskOverview
                  tasks={tasks}
                  loading={loading}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>
            </div>
          )}

          {/* Dedicated Tasks View */}
          {activeTab === 'tasks' && (
            <div style={{ maxWidth: 880, width: '100%', margin: '0 auto' }}>
              <TaskOverview
                tasks={tasks}
                loading={loading}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          )}

          {/* Dedicated Focus View */}
          {activeTab === 'focus' && (
            <div style={{ maxWidth: 880, width: '100%', margin: '0 auto' }}>
              <FocusView timer={timer} tasks={tasks} onToggleTask={handleToggleTask} />
            </div>
          )}

          {/* Upcoming Section View (Notes) */}
          {activeTab !== 'overview' && activeTab !== 'tasks' && activeTab !== 'focus' && (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--accent-primary-soft)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <svg
                  width="24"
                  height="24"
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
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 8
                }}
              >
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  maxWidth: 420,
                  margin: '0 auto 20px'
                }}
              >
                This section is part of upcoming milestones. You can explore the Pomodoro timer in
                the Overview or Focus tab.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{
                  maxWidth: 160,
                  margin: '0 auto',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('overview')}
              >
                Back to Overview
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
