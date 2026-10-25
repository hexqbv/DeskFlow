import { useState, useEffect, useRef, useCallback } from 'react'
import { playChime } from '../utils/audio.js'

export const STANDARD_DURATIONS = {
  focus: 25 * 60, // 25 minutes = 1500s
  shortBreak: 5 * 60, // 5 minutes = 300s
  longBreak: 15 * 60 // 15 minutes = 900s
}

export const DEV_FAST_DURATIONS = {
  focus: 10, // 10 seconds
  shortBreak: 5, // 5 seconds
  longBreak: 8 // 8 seconds
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function usePomodoro() {
  const [mode, setMode] = useState('focus')
  const [status, setStatus] = useState('idle') // 'idle' | 'running' | 'paused' | 'completed'
  const [devFastMode, setDevFastMode] = useState(false)
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0)
  const [pendingTransition, setPendingTransition] = useState(null)

  const durations = devFastMode ? DEV_FAST_DURATIONS : STANDARD_DURATIONS
  const targetDuration = durations[mode]
  const [remainingSeconds, setRemainingSeconds] = useState(targetDuration)

  const endTimeRef = useRef(null)

  // Start the timer
  const startTimer = useCallback(() => {
    if (status === 'running') return // prevent duplicate timers
    endTimeRef.current = Date.now() + remainingSeconds * 1000
    setStatus('running')
    setPendingTransition(null)
  }, [remainingSeconds, status])

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (status !== 'running') return
    if (endTimeRef.current) {
      const left = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
      setRemainingSeconds(left)
    }
    endTimeRef.current = null
    setStatus('paused')
  }, [status])

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (status === 'running') return
    endTimeRef.current = Date.now() + remainingSeconds * 1000
    setStatus('running')
  }, [remainingSeconds, status])

  // Reset current session
  const resetTimer = useCallback(() => {
    endTimeRef.current = null
    setStatus('idle')
    setPendingTransition(null)
    setRemainingSeconds(durations[mode])
  }, [durations, mode])

  // Switch mode
  const switchMode = useCallback(
    (newMode) => {
      endTimeRef.current = null
      setStatus('idle')
      setPendingTransition(null)
      setMode(newMode)
      setRemainingSeconds(durations[newMode])
    },
    [durations]
  )

  // Toggle Dev Fast Mode
  const toggleDevFastMode = useCallback(() => {
    endTimeRef.current = null
    setStatus('idle')
    setPendingTransition(null)
    setDevFastMode((prev) => {
      const next = !prev
      const nextDurations = next ? DEV_FAST_DURATIONS : STANDARD_DURATIONS
      setRemainingSeconds(nextDurations[mode])
      return next
    })
  }, [mode])

  // Countdown effect using timestamp verification
  useEffect(() => {
    if (status !== 'running') return

    const intervalId = setInterval(() => {
      if (!endTimeRef.current) return

      const now = Date.now()
      const left = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
      setRemainingSeconds(left)

      if (left <= 0) {
        clearInterval(intervalId)
        endTimeRef.current = null
        setStatus('completed')

        // Play chime sound
        playChime()

        if (mode === 'focus') {
          setCompletedFocusSessions((prevCount) => {
            const newCount = prevCount + 1
            const isLongBreak = newCount % 4 === 0
            const suggestedMode = isLongBreak ? 'longBreak' : 'shortBreak'
            const title = isLongBreak ? 'Pomodoro Cycle Complete!' : 'Focus Session Finished!'
            const body = isLongBreak
              ? 'You completed 4 focus sessions. Time for a 15-minute long break!'
              : 'Great job! Take a 5-minute break to recharge.'

            if (window.api && typeof window.api.showNotification === 'function') {
              window.api.showNotification({ title, body })
            }

            setPendingTransition({
              type: 'focusCompleted',
              suggestedMode,
              cycleCompleted: isLongBreak,
              message: isLongBreak
                ? 'Cycle complete (4 sessions)! Ready for a 15-minute long break?'
                : 'Focus session complete! Ready for a 5-minute short break?'
            })

            return newCount
          })
        } else {
          // Break finished
          const title = 'Break Finished!'
          const body = 'Your break has ended. Ready to start your next focus session?'

          if (window.api && typeof window.api.showNotification === 'function') {
            window.api.showNotification({ title, body })
          }

          setPendingTransition({
            type: 'breakCompleted',
            suggestedMode: 'focus',
            cycleCompleted: false,
            message: 'Break is over. Ready to begin your next focus session?'
          })
        }
      }
    }, 200)

    return () => clearInterval(intervalId)
  }, [status, mode])

  // Accept suggested transition (switches mode with user consent)
  const acceptTransition = useCallback(() => {
    if (!pendingTransition) return
    const nextMode = pendingTransition.suggestedMode
    setPendingTransition(null)
    switchMode(nextMode)
  }, [pendingTransition, switchMode])

  // Dismiss transition
  const dismissTransition = useCallback(() => {
    setPendingTransition(null)
    resetTimer()
  }, [resetTimer])

  // Visual progress percentage (0% to 100%)
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((targetDuration - remainingSeconds) / targetDuration) * 100))
  )

  // Current session number in the 4-session cycle (1 to 4)
  const currentCycleSession = (completedFocusSessions % 4) + 1

  return {
    mode,
    status,
    remainingSeconds,
    targetDuration,
    progressPercent,
    formattedTime: formatTime(remainingSeconds),
    completedFocusSessions,
    currentCycleSession,
    pendingTransition,
    devFastMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    switchMode,
    acceptTransition,
    dismissTransition,
    toggleDevFastMode
  }
}
