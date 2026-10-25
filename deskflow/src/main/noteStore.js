import { app, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'

const DEFAULT_NOTES = [
  {
    id: 'note_welcome',
    title: 'Welcome to DeskFlow Notes',
    content: `# Welcome to DeskFlow Notes 📝

DeskFlow Notes is your clean, distraction-free markdown scratchpad for deep work.

### Markdown Features Supported:
- **Bold text** and *italic emphasis*
- ~~Strikethrough~~ text
- [DeskFlow Documentation](https://electron-vite.org)

### Checklists & Tasks:
- [x] Launch DeskFlow workspace
- [x] Configure Pomodoro focus timer
- [ ] Draft tomorrow's project architecture

### Code Snippets:
Inline \`const deskflow = true\` and syntax code blocks:

\`\`\`javascript
function stayFocused() {
  const sessions = 4;
  console.log("Ready for deep work!");
}
\`\`\`

> "Focus is a muscle. The more you practice single-tasking, the easier deep work becomes."

---
*Created automatically for your workspace. Feel free to edit or delete this note.*`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note_deep_work_guide',
    title: 'Deep Work Daily Ritual',
    content: `# Daily Deep Work Protocol

1. **Clear Distractions**: Close social tabs and silence notifications.
2. **Define One Single Objective**: Focus on one key milestone task.
3. **Execute 4 Pomodoro Intervals**: 25m focus + 5m short break.
4. **Take a 15m Long Break**: Step away from the screen and hydrate.

### Session Checklist:
- [ ] Review today's task priority
- [ ] Set timer to 25 minutes
- [ ] Capture stray thoughts in DeskFlow Notes`,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
]

export function getNotesFilePath() {
  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }
  return join(userDataDir, 'deskflow-notes.json')
}

export function validateNote(note) {
  if (!note || typeof note !== 'object') return null

  const title =
    typeof note.title === 'string' && note.title.trim().length > 0
      ? note.title.trim()
      : 'Untitled Note'
  const content = typeof note.content === 'string' ? note.content : ''

  return {
    id:
      typeof note.id === 'string' && note.id.trim().length > 0
        ? note.id.trim()
        : `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    content,
    createdAt:
      typeof note.createdAt === 'string' && note.createdAt.trim().length > 0
        ? note.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof note.updatedAt === 'string' && note.updatedAt.trim().length > 0
        ? note.updatedAt
        : new Date().toISOString()
  }
}

export async function loadNotes() {
  const filePath = getNotesFilePath()
  try {
    if (!fs.existsSync(filePath)) {
      // First run: save default notes
      await fs.promises.writeFile(filePath, JSON.stringify(DEFAULT_NOTES, null, 2), 'utf-8')
      return DEFAULT_NOTES
    }

    const content = await fs.promises.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) {
      console.warn('Notes file is not an array; resetting to empty array.')
      return []
    }

    const validated = []
    for (const item of parsed) {
      const valid = validateNote(item)
      if (valid) validated.push(valid)
    }
    return validated
  } catch (err) {
    console.error('Error reading notes file from disk:', err)
    return []
  }
}

export async function saveNotes(notes) {
  if (!Array.isArray(notes)) {
    throw new Error('Notes payload must be an array')
  }

  const validated = []
  for (const item of notes) {
    const valid = validateNote(item)
    if (valid) validated.push(valid)
  }

  const filePath = getNotesFilePath()
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(validated, null, 2), 'utf-8')
    return validated
  } catch (err) {
    console.error('Error writing notes file to disk:', err)
    throw new Error('Failed to persist notes', { cause: err })
  }
}

export async function createNote(initialData = {}) {
  const newNote = validateNote({
    title: initialData.title || 'Untitled Note',
    content: initialData.content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const currentNotes = await loadNotes()
  const updated = [newNote, ...currentNotes]
  await saveNotes(updated)
  return { newNote, notes: updated }
}

export async function updateNote(noteUpdate) {
  if (!noteUpdate || !noteUpdate.id) {
    throw new Error('Note ID is required for update')
  }

  const currentNotes = await loadNotes()
  const updated = currentNotes.map((note) => {
    if (note.id === noteUpdate.id) {
      return validateNote({
        ...note,
        title: typeof noteUpdate.title === 'string' ? noteUpdate.title : note.title,
        content: typeof noteUpdate.content === 'string' ? noteUpdate.content : note.content,
        updatedAt: new Date().toISOString()
      })
    }
    return note
  })

  await saveNotes(updated)
  return updated
}

export async function deleteNote(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Invalid note id')
  }
  const strId = String(id)
  const currentNotes = await loadNotes()
  const updated = currentNotes.filter((note) => note.id !== strId)
  await saveNotes(updated)
  return updated
}

export async function exportNoteToMarkdown(win, note) {
  if (!note || typeof note !== 'object') {
    return { success: false, error: 'Invalid note payload' }
  }

  const safeTitle = (note.title || 'Untitled')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .slice(0, 50)
  const content = typeof note.content === 'string' ? note.content : ''

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Note as Markdown',
    defaultPath: `${safeTitle || 'Note'}.md`,
    filters: [{ name: 'Markdown Document', extensions: ['md'] }]
  })

  if (canceled || !filePath) {
    return { success: false, canceled: true }
  }

  try {
    await fs.promises.writeFile(filePath, content, 'utf-8')
    return { success: true, filePath }
  } catch (err) {
    console.error('Failed to export markdown file:', err)
    return { success: false, error: err.message }
  }
}

