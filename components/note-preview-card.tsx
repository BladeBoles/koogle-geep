'use client'

import { Note } from '@/lib/types/database'
import { Card } from '@/components/ui/card'

interface NotePreviewCardProps {
  note: Note
  onClick: () => void
}

export function NotePreviewCard({ note, onClick }: NotePreviewCardProps) {
  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const contentPreview = note.content ? stripHtml(note.content).slice(0, 200) : ''

  return (
    <Card
      className="p-4 break-inside-avoid mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {note.title && (
        <h3 className="font-medium mb-2 text-base">{note.title}</h3>
      )}

      {contentPreview && (
        <p className="text-sm text-muted-foreground line-clamp-6">
          {contentPreview}
        </p>
      )}
    </Card>
  )
}
