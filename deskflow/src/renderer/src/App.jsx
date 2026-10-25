import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import FocusTimerPreview from './components/FocusTimerPreview'
import DailyProgress from './components/DailyProgress'
import TaskOverview from './components/TaskOverview'
import FocusView from './components/FocusView'
import NotesView from './components/NotesView'
import { usePomodoro } from './hooks/usePomodoro'

const LOCAL_STORAGE_TASKS_KEY = 'deskflow_tasks_fallback'
const LOCAL_STORAGE_NOTES_KEY = 'deskflow_notes_fallback'

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState([])
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize shared Pomodoro timer
  const timer = usePomodoro()

  // Ref to hold pending note save debounce
  const noteDebounceRef = useRef(null)

  // Load tasks & notes on mount
  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        // 1. Load tasks
        if (window.api && typeof window.api.getTasks === 'function') {
          const stored = await window.api.getTasks()
          if (isMounted) {
            setTasks(Array.isArray(stored) ? stored : [])
          }
        } else {
          await Promise.resolve()
          const cached = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY)
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
              localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(starterTasks))
            }
          }
        }

        // 2. Load notes
        if (window.api && typeof window.api.getNotes === 'function') {
          const storedNotes = await window.api.getNotes()
          if (isMounted && Array.isArray(storedNotes)) {
            setNotes(storedNotes)
            if (storedNotes.length > 0) {
              setActiveNoteId(storedNotes[0].id)
            }
          }
        } else {
          await Promise.resolve()
          const cachedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY)
          if (cachedNotes) {
            const parsed = JSON.parse(cachedNotes)
            if (isMounted) {
              setNotes(parsed)
              if (parsed.length > 0) setActiveNoteId(parsed[0].id)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  // ================= TASK HANDLERS =================
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
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to add task:', err)
    }
  }

  const handleToggleTask = async (id) => {
    try {
      if (window.api && typeof window.api.toggleTask === 'function') {
        const updated = await window.api.toggleTask(id)
        setTasks(updated)
      } else {
        const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        setTasks(updated)
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      if (window.api && typeof window.api.deleteTask === 'function') {
        const updated = await window.api.deleteTask(id)
        setTasks(updated)
      } else {
        const updated = tasks.filter((t) => t.id !== id)
        setTasks(updated)
        localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  // ================= NOTE HANDLERS =================
  const handleCreateNote = async () => {
    try {
      if (window.api && typeof window.api.createNote === 'function') {
        const res = await window.api.createNote({ title: 'Untitled Note', content: '' })
        if (res && res.notes) {
          setNotes(res.notes)
          setActiveNoteId(res.newNote.id)
        }
      } else {
        const newNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: 'Untitled Note',
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        const updated = [newNote, ...notes]
        setNotes(updated)
        setActiveNoteId(newNote.id)
        localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  const handleUpdateNote = useCallback((update) => {
    if (!update || !update.id) return

    // Update state immediately for instant feedback
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === update.id
          ? {
              ...note,
              title: typeof update.title === 'string' ? update.title : note.title,
              content: typeof update.content === 'string' ? update.content : note.content,
              updatedAt: new Date().toISOString()
            }
          : note
      )
    )

    // Debounce saving to disk
    if (noteDebounceRef.current) {
      clearTimeout(noteDebounceRef.current)
    }

    noteDebounceRef.current = setTimeout(async () => {
      try {
        if (window.api && typeof window.api.updateNote === 'function') {
          await window.api.updateNote(update)
        } else {
          // Local fallback
          setNotes((currentNotes) => {
            localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(currentNotes))
            return currentNotes
          })
        }
      } catch (err) {
        console.error('Failed to save note update:', err)
      }
    }, 350)
  }, [])

  const handleDeleteNote = async (id) => {
    try {
      if (window.api && typeof window.api.deleteNote === 'function') {
        const updated = await window.api.deleteNote(id)
        setNotes(updated)
        if (activeNoteId === id) {
          setActiveNoteId(updated.length > 0 ? updated[0].id : null)
        }
      } else {
        const updated = notes.filter((n) => n.id !== id)
        setNotes(updated)
        if (activeNoteId === id) {
          setActiveNoteId(updated.length > 0 ? updated[0].id : null)
        }
        localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(updated))
      }
    } catch (err) {
      console.error('Failed to delete note:', err)
    }
  }

  const handleExportNote = async (note) => {
    try {
      if (window.api && typeof window.api.exportNote === 'function') {
        return await window.api.exportNote(note)
      }
      return { success: false, reason: 'Export API unavailable' }
    } catch (err) {
      console.error('Failed to export note:', err)
      return { success: false, error: err.message }
    }
  }

  const pendingCount = tasks.filter((t) => !t.completed).length

  // Live sidebar focus badge
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
        notesCount={notes.length}
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

          {/* Dedicated Notes View */}
          {activeTab === 'notes' && (
            <div style={{ width: '100%', height: 'calc(100vh - 120px)', minHeight: 480 }}>
              <NotesView
                notes={notes}
                activeNoteId={activeNoteId}
                onSelectNote={setActiveNoteId}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onExportNote={handleExportNote}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
