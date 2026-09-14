import { useEffect, useState } from 'react'

import useLocalStorage from '../hooks/useLocalStorage'

export const EditorColumn = ({ focusedSectionSlug, templates, setTemplates, theme }) => {
  const getMarkdown = () => {
    const section = templates.find((s) => s.slug === focusedSectionSlug)
    return section ? section.markdown : ''
  }

  const [markdown, setMarkdown] = useState(getMarkdown())
  const { saveBackup } = useLocalStorage()

  useEffect(() => {
    const markdown = getMarkdown()
    setMarkdown(markdown)
  }, [focusedSectionSlug, templates])

  const onEdit = (val) => {
    setMarkdown(val)
    const newTemplates = templates.map((template) => {
      if (template.slug === focusedSectionSlug) {
        return { ...template, markdown: val }
      }
      return template
    })
    setTemplates(newTemplates)
    saveBackup(newTemplates)
  }

  if (focusedSectionSlug === 'noEdit') {
    return (
      <p className="text-sm text-emerald-500 max-w-[28rem] text-center mx-auto mt-10" data-testid="rs-noedit-hint">
        Select a section from the left sidebar to edit the contents
      </p>
    )
  }

  return (
    <textarea
      aria-label="Markdown Editor"
      data-testid="rs-editor-textarea"
      onChange={(e) => onEdit(e.target.value)}
      value={markdown}
      className="full-screen rounded-sm border border-gray-500 w-full p-6 resize-none"
    />
  )
}
