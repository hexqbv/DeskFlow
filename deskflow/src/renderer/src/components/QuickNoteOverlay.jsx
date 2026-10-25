import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * QuickNoteOverlay
 *
 * A floating modal overlay that lets the user jot down a quick note and save
 * it to the existing note store without leaving the current view.
 *
 * Props:
 *   onSave(newNote)  – called with the freshly created note object
 *   onClose()        – called when the overlay should close
 */
export default function QuickNoteOverlay({ onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  // Auto-focus the title field when the overlay opens
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title])

  const hasContent = title.trim().length > 0 || content.trim().length > 0

  function handleClose() {
    if (hasContent) {
      // Warn the user if they have unsaved content
      const confirmed = window.confirm('You have unsaved content. Discard this note?')
      if (!confirmed) return
    }
    onClose()
  }

  async function handleSave() {
    const trimmedTitle = title.trim() || 'Quick Note'
    const trimmedContent = content.trim()

    setSaving(true)
    setError('')

    try {
      if (window.api && typeof window.api.createNote === 'function') {
        const res = await window.api.createNote({
          title: trimmedTitle,
          content: trimmedContent
        })
        if (res && res.newNote) {
          onSave(res.newNote, res.notes)
        } else {
          throw new Error('Unexpected response from note store')
        }
      } else {
        // Fallback when running outside Electron (browser dev mode)
        const fallbackNote = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: trimmedTitle,
          content: trimmedContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        onSave(fallbackNote, null)
      }
    } catch (err) {
      console.error('[QuickNoteOverlay] Failed to save note:', err)
      setError('Failed to save the note. Please try again.')
      setSaving(false)
    }
  }

  // Ctrl/Cmd + Enter saves the note
  function handleContentKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="qno-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="qno-card" role="dialog" aria-modal="true" aria-label="Quick Note">
        {/* Header */}
        <div className="qno-header">
          <div className="qno-header-left">
            <span className="qno-icon">📝</span>
            <span className="qno-title-label">Quick Note</span>
          </div>
          <button className="qno-close-btn" onClick={handleClose} aria-label="Close quick note">
            ✕
          </button>
        </div>

        {/* Title input */}
        <input
          ref={titleRef}
          className="qno-title-input"
          type="text"
          placeholder="Note title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          disabled={saving}
        />

        {/* Content textarea */}
        <textarea
          className="qno-content-area"
          placeholder="Start writing… Markdown is supported."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleContentKeyDown}
          disabled={saving}
          rows={8}
        />

        {/* Error message */}
        {error && <p className="qno-error">{error}</p>}

        {/* Footer */}
        <div className="qno-footer">
          <span className="qno-hint">
            <kbd>⌘ Enter</kbd> to save &nbsp;·&nbsp; <kbd>Esc</kbd> to close
          </span>
          <div className="qno-actions">
            <button className="qno-btn qno-btn-secondary" onClick={handleClose} disabled={saving}>
              Discard
            </button>
            <button className="qno-btn qno-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

QuickNoteOverlay.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
}
