import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

const DEFAULT_TASKS = [
  {
    id: 'task_default_1',
    title: 'Explore DeskFlow workspace dashboard',
    completed: true,
    createdAt: new Date().toISOString(),
    priority: 'high',
    tag: 'Milestone 1'
  },
  {
    id: 'task_default_2',
    title: 'Try checking off or adding a new task',
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'high',
    tag: 'Milestone 2'
  },
  {
    id: 'task_default_3',
    title: 'Prepare Pomodoro focus timer integration',
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'medium',
    tag: 'Upcoming'
  }
]

export function getTasksFilePath() {
  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true })
  }
  return join(userDataDir, 'deskflow-tasks.json')
}

export function validateTask(task) {
  if (!task || typeof task !== 'object') return null
  if (typeof task.title !== 'string') return null

  const trimmedTitle = task.title.trim()
  if (trimmedTitle.length === 0 || trimmedTitle.length > 500) return null

  const validPriorities = ['low', 'medium', 'high']
  const priority = validPriorities.includes(task.priority) ? task.priority : 'medium'

  return {
    id:
      typeof task.id === 'string' && task.id.trim().length > 0
        ? task.id.trim()
        : `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: trimmedTitle,
    completed: Boolean(task.completed),
    createdAt:
      typeof task.createdAt === 'string' && task.createdAt.trim().length > 0
        ? task.createdAt
        : new Date().toISOString(),
    priority,
    tag: typeof task.tag === 'string' && task.tag.trim().length > 0 ? task.tag.trim() : 'Task'
  }
}

export async function loadTasks() {
  const filePath = getTasksFilePath()
  try {
    if (!fs.existsSync(filePath)) {
      // First run: save default starter tasks
      await fs.promises.writeFile(filePath, JSON.stringify(DEFAULT_TASKS, null, 2), 'utf-8')
      return DEFAULT_TASKS
    }

    const fileContent = await fs.promises.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(fileContent)
    if (!Array.isArray(parsed)) {
      console.warn('Tasks file does not contain an array; resetting to empty array.')
      return []
    }

    const validatedTasks = []
    for (const item of parsed) {
      const valid = validateTask(item)
      if (valid) {
        validatedTasks.push(valid)
      }
    }
    return validatedTasks
  } catch (error) {
    console.error('Error reading tasks file from disk:', error)
    return []
  }
}

export async function saveTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('Tasks payload must be an array')
  }

  const validatedTasks = []
  for (const item of tasks) {
    const valid = validateTask(item)
    if (valid) {
      validatedTasks.push(valid)
    }
  }

  const filePath = getTasksFilePath()
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(validatedTasks, null, 2), 'utf-8')
    return validatedTasks
  } catch (error) {
    console.error('Error writing tasks file to disk:', error)
    throw new Error('Failed to persist tasks', { cause: error })
  }
}

export async function addTask(title, options = {}) {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error('Task title cannot be empty')
  }

  const newTask = validateTask({
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    priority: options.priority || 'medium',
    tag: options.tag || 'Task'
  })

  const currentTasks = await loadTasks()
  const updated = [newTask, ...currentTasks]
  await saveTasks(updated)
  return updated
}

export async function toggleTask(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Invalid task id')
  }
  const strId = String(id)
  const currentTasks = await loadTasks()
  const updated = currentTasks.map((task) =>
    task.id === strId ? { ...task, completed: !task.completed } : task
  )
  await saveTasks(updated)
  return updated
}

export async function deleteTask(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new Error('Invalid task id')
  }
  const strId = String(id)
  const currentTasks = await loadTasks()
  const updated = currentTasks.filter((task) => task.id !== strId)
  await saveTasks(updated)
  return updated
}

export function getStorageInfo() {
  return {
    filePath: getTasksFilePath()
  }
}
