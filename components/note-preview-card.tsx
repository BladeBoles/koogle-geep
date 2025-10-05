'use client'

import { Note } from '@/lib/types/database'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NotePreviewCardProps {
  note: Note
  onClick: () => void
  onPin?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export function NotePreviewCard({ note, onClick, onPin, onArchive, onDelete }: NotePreviewCardProps) {
  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const contentPreview = note.content ? stripHtml(note.content).slice(0, 200) : ''

  return (
    <Card
      className="p-4 break-inside-avoid mb-4 hover:shadow-lg transition-shadow group relative"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          {note.title && (
            <h3 className="font-medium text-base">{note.title}</h3>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 cursor-pointer ${note.is_pinned ? 'opacity-100' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
            >
              <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-current' : ''}`} />
            </Button>
          )}
          {(onArchive || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {onArchive && (
                  <DropdownMenuItem onClick={onArchive} className="cursor-pointer">
                    Archive
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive cursor-pointer">
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {contentPreview && (
        <p className="text-sm text-muted-foreground line-clamp-6 cursor-pointer" onClick={onClick}>
          {contentPreview}
        </p>
      )}
    </Card>
  )
}
