/* eslint-disable react/prop-types */
import { useState, useMemo, useRef, useEffect } from 'react'
import { renderMarkdown } from '../utils/markdown'

export default function NotesView({
  notes = [],
  activeNoteId = null,
  onSelectNote = () => {},
  onCreateNote = () => {},
  onUpdateNote = () => {},
  onDeleteNote = () => {},
  onExportNote = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('split') // 'edit' | 'split' | 'preview'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exportNotice, setExportNotice] = useState(null)

  // Current active note
  const selectedNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || notes[0] || null
  }, [notes, activeNoteId])

  // Filtered notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase().trim()
    return notes.filter(
      (note) =>
        (note.title && note.title.toLowerCase().includes(q)) ||
        (note.content && note.content.toLowerCase().includes(q))
    )
  }, [notes, searchQuery])

  // Rendered HTML preview
  const renderedHtml = useMemo(() => {
    if (!selectedNote) return ''
    return renderMarkdown(selectedNote.content)
  }, [selectedNote])

  // Word count and char count
  const stats = useMemo(() => {
    if (!selectedNote || !selectedNote.content) return { words: 0, chars: 0 }
    const text = selectedNote.content.trim()
    const words = text ? text.split(/\s+/).length : 0
    return { words, chars: text.length }
  }, [selectedNote])

  // Reset delete confirmation when active note changes
  const prevNoteIdRef = useRef(activeNoteId)
  useEffect(() => {
    if (prevNoteIdRef.current !== activeNoteId) {
      prevNoteIdRef.current = activeNoteId
      setShowDeleteConfirm(false)
    }
  }, [activeNoteId])

  // Format date helper
  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(date)
    } catch {
      return ''
    }
  }

  // Handle Export Click
  const handleExportClick = async () => {
    if (!selectedNote) return
    const result = await onExportNote(selectedNote)
    if (result && result.success) {
      setExportNotice('Exported successfully!')
      setTimeout(() => setExportNotice(null), 3000)
    }
  }

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!selectedNote) return
    onDeleteNote(selectedNote.id)
    setShowDeleteConfirm(false)
  }

  return (
    <div className="notes-container">
      {/* Left Pane: Notes List & Search */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div className="notes-header-title-group">
            <h2 className="notes-header-title">Notes</h2>
            <span className="notes-count-badge">{notes.length}</span>
          </div>

          <button
            type="button"
            className="btn-new-note"
            onClick={onCreateNote}
            title="Create a new note"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Note</span>
          </button>
        </div>

        {/* Search input */}
        <div className="notes-search-wrapper">
          <svg
            className="notes-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="notes-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Notes list */}
        <div className="notes-list">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const isSelected = selectedNote && selectedNote.id === note.id
              // Snippet preview: first line with text without markdown headers
              const previewSnippet = note.content
                ? note.content
                    .split('\n')
                    .map((l) => l.replace(/^[#>\s*-]+/, '').trim())
                    .find((l) => l.length > 0) || 'Empty note'
                : 'Empty note'

              return (
                <div
                  key={note.id}
                  className={`notes-list-item ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectNote(note.id)}
                >
                  <div className="notes-item-title">{note.title || 'Untitled Note'}</div>
                  <div className="notes-item-snippet">{previewSnippet}</div>
                  <div className="notes-item-date">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="notes-empty-state">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <p className="notes-empty-title">
                {searchQuery ? 'No matching notes' : 'No notes yet'}
              </p>
              <p className="notes-empty-sub">
                {searchQuery
                  ? 'Try a different keyword or clear search.'
                  : 'Click "New Note" to capture your thoughts.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: 12, fontSize: 12, padding: '6px 12px', width: 'auto' }}
                  onClick={onCreateNote}
                >
                  Create First Note
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Note Editor & Preview */}
      <div className="notes-editor-pane">
        {selectedNote ? (
          <>
            {/* Note Toolbar */}
            <div className="notes-toolbar">
              <input
                type="text"
                className="notes-title-input"
                placeholder="Note Title..."
                value={selectedNote.title}
                onChange={(e) =>
                  onUpdateNote({
                    id: selectedNote.id,
                    title: e.target.value,
                    content: selectedNote.content
                  })
                }
              />

              <div className="notes-toolbar-actions">
                {/* View mode toggle: Edit, Split, Preview */}
                <div className="notes-mode-switcher">
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === 'edit' ? 'active' : ''}`}
                    onClick={() => setViewMode('edit')}
                    title="Editor only"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === 'split' ? 'active' : ''}`}
                    onClick={() => setViewMode('split')}
                    title="Split view (Side-by-side)"
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                    onClick={() => setViewMode('preview')}
                    title="Markdown preview only"
                  >
                    Preview
                  </button>
                </div>

                {/* Export button */}
                <button
                  type="button"
                  className="btn-toolbar-action"
                  onClick={handleExportClick}
                  title="Export note as a .md file"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Export</span>
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  className="btn-toolbar-action btn-delete-note"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete this note"
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

            {/* Export confirmation notice */}
            {exportNotice && <div className="notes-export-banner">✔ {exportNotice}</div>}

            {/* Delete Confirmation Banner */}
            {showDeleteConfirm && (
              <div className="notes-delete-confirm-banner">
                <div className="delete-confirm-text">
                  <span>Are you sure you want to delete &ldquo;{selectedNote.title}&rdquo;?</span>
                </div>
                <div className="delete-confirm-buttons">
                  <button
                    type="button"
                    className="btn-confirm-delete"
                    onClick={handleConfirmDelete}
                  >
                    Delete Note
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-delete"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Editor Workspace Area */}
            <div className={`notes-workspace ${viewMode}`}>
              {/* Textarea Editor (visible in 'edit' and 'split') */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className="notes-textarea-wrapper">
                  <textarea
                    className="notes-textarea"
                    placeholder="Write Markdown here... Use # for headings, - [ ] for checklists, **bold**, *italic*, `code`, etc."
                    value={selectedNote.content}
                    onChange={(e) =>
                      onUpdateNote({
                        id: selectedNote.id,
                        title: selectedNote.title,
                        content: e.target.value
                      })
                    }
                  ></textarea>
                </div>
              )}

              {/* Live Markdown Preview (visible in 'preview' and 'split') */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="notes-preview-wrapper">
                  <div
                    className="notes-markdown-body"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  ></div>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="notes-statusbar">
              <div className="notes-status-left">
                <span>
                  {stats.words} words • {stats.chars} characters
                </span>
              </div>
              <div className="notes-status-right">
                <span>
                  Last updated: {formatDate(selectedNote.updatedAt || selectedNote.createdAt)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="notes-no-selection">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <h3>Select a note or create a new one</h3>
            <p>Capture thoughts, markdown notes, code snippets, and checklists.</p>
            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', marginTop: 16 }}
              onClick={onCreateNote}
            >
              + Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
