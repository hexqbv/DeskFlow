/**
 * Safe, dependency-free Markdown to HTML parser for DeskFlow
 * Guarantees zero script injection by strictly escaping all raw HTML before parsing.
 */

function escapeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeUrl(url) {
  if (!url) return '#'
  const trimmed = url.trim()
  // Disallow dangerous schemes like javascript:, data:, vbscript:
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return '#unsafe-link'
  }
  return escapeHtml(trimmed)
}

function formatInline(text) {
  if (!text) return ''

  // Inline code `code` (use placeholder to protect against formatting inside code)
  const codeSnippets = []
  let formatted = text.replace(/`([^`\n]+)`/g, (_, code) => {
    const idx = codeSnippets.length
    codeSnippets.push(`<code class="md-inline-code">${code}</code>`)
    return `@@@INLINE_CODE_${idx}@@@`
  })

  // Links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = sanitizeUrl(url)
    return `<a href="${safeUrl}" class="md-link" target="_blank" rel="noopener noreferrer">${label}</a>`
  })

  // Bold & Italic ***text***
  formatted = formatted.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')

  // Bold **text** or __text__
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Italic *text* or _text_
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  formatted = formatted.replace(/\b_([^_]+)_\b/g, '<em>$1</em>')

  // Strikethrough ~~text~~
  formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // Restore inline code snippets
  formatted = formatted.replace(/@@@INLINE_CODE_(\d+)@@@/g, (_, idx) => {
    return codeSnippets[Number(idx)] || ''
  })

  return formatted
}

export function renderMarkdown(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return '<p class="md-empty">No content to preview</p>'
  }

  // 1. First, escape all raw HTML to prevent any script execution or raw injection
  const escaped = escapeHtml(rawMarkdown)

  // 2. Extract fenced code blocks ```[lang]\n...\n```
  const codeBlocks = []
  const textWithoutCodeBlocks = escaped.replace(
    /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const idx = codeBlocks.length
      const langAttr = lang ? ` data-lang="${lang.toLowerCase()}"` : ''
      codeBlocks.push(`<pre class="md-code-block"${langAttr}><code>${code.trimEnd()}</code></pre>`)
      return `\n@@@CODE_BLOCK_${idx}@@@\n`
    }
  )

  const lines = textWithoutCodeBlocks.split(/\r?\n/)
  const output = []
  let currentList = null // { type: 'ul' | 'ol' | 'checklist', items: [] }
  let currentBlockquote = []

  const flushList = () => {
    if (!currentList) return
    const { type, items } = currentList
    if (type === 'checklist') {
      output.push(`<ul class="md-checklist">\n${items.join('\n')}\n</ul>`)
    } else if (type === 'ol') {
      output.push(`<ol class="md-ol">\n${items.join('\n')}\n</ol>`)
    } else {
      output.push(`<ul class="md-ul">\n${items.join('\n')}\n</ul>`)
    }
    currentList = null
  }

  const flushBlockquote = () => {
    if (currentBlockquote.length === 0) return
    output.push(
      `<blockquote class="md-blockquote"><p>${currentBlockquote.join('<br />')}</p></blockquote>`
    )
    currentBlockquote = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line resets block groups
    if (trimmed === '') {
      flushList()
      flushBlockquote()
      continue
    }

    // Code block placeholder
    const codeMatch = trimmed.match(/^@@@CODE_BLOCK_(\d+)@@@$/)
    if (codeMatch) {
      flushList()
      flushBlockquote()
      const blockIdx = Number(codeMatch[1])
      output.push(codeBlocks[blockIdx] || '')
      continue
    }

    // Blockquote > text
    if (line.startsWith('&gt; ') || line.startsWith('&gt;')) {
      flushList()
      const bqText = line.replace(/^&gt;\s?/, '')
      currentBlockquote.push(formatInline(bqText))
      continue
    } else {
      flushBlockquote()
    }

    // Horizontal Rule ---, ***, ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList()
      output.push('<hr class="md-hr" />')
      continue
    }

    // Headings # .. ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const titleText = formatInline(headingMatch[2])
      output.push(`<h${level} class="md-h${level}">${titleText}</h${level}>`)
      continue
    }

    // Checklist: - [ ] or - [x] or * [ ] or * [x]
    const checklistMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/)
    if (checklistMatch) {
      const isChecked = checklistMatch[1].toLowerCase() === 'x'
      const itemContent = formatInline(checklistMatch[2])
      const checkItem = `<li class="md-checklist-item ${isChecked ? 'checked' : ''}">
        <input type="checkbox" ${isChecked ? 'checked' : ''} disabled />
        <span>${itemContent}</span>
      </li>`

      if (currentList && currentList.type === 'checklist') {
        currentList.items.push(checkItem)
      } else {
        flushList()
        currentList = { type: 'checklist', items: [checkItem] }
      }
      continue
    }

    // Unordered List: - item or * item
    const ulMatch = line.match(/^[-*+]\s+(.+)$/)
    if (ulMatch) {
      const itemContent = formatInline(ulMatch[1])
      const listItem = `<li>${itemContent}</li>`
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(listItem)
      } else {
        flushList()
        currentList = { type: 'ul', items: [listItem] }
      }
      continue
    }

    // Ordered List: 1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      const itemContent = formatInline(olMatch[1])
      const listItem = `<li>${itemContent}</li>`
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(listItem)
      } else {
        flushList()
        currentList = { type: 'ol', items: [listItem] }
      }
      continue
    }

    // Default: paragraph
    flushList()
    output.push(`<p class="md-p">${formatInline(line)}</p>`)
  }

  flushList()
  flushBlockquote()

  return output.join('\n')
}
