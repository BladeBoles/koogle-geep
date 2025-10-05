'use client'

import { ListWithItems } from '@/lib/types/database'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { MoreVertical, Pin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ListPreviewCardProps {
  list: ListWithItems
  onClick: () => void
  onPin?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export function ListPreviewCard({ list, onClick, onPin, onArchive, onDelete }: ListPreviewCardProps) {
  const activeItems = list.list_items
    .filter(item => !item.is_completed)
    .sort((a, b) => a.position - b.position)
    .slice(0, 5) // Show max 5 items in preview

  const completedCount = list.list_items.filter(item => item.is_completed).length

  return (
    <Card
      className="p-4 break-inside-avoid mb-4 hover:shadow-lg transition-shadow group relative"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          {list.title && (
            <h3 className="font-medium text-base">{list.title}</h3>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 cursor-pointer ${list.is_pinned ? 'opacity-100' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
            >
              <Pin className={`h-4 w-4 ${list.is_pinned ? 'fill-current' : ''}`} />
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

      <div className="space-y-1 cursor-pointer" onClick={onClick}>
        {activeItems.map(item => {
          // Strip HTML tags for preview
          const stripHtml = (html: string) => {
            if (typeof window === 'undefined') return html
            const tmp = document.createElement('div')
            tmp.innerHTML = html
            return tmp.textContent || tmp.innerText || ''
          }

          const textContent = stripHtml(item.content)

          return (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox checked={false} disabled className="pointer-events-none" />
              <span className="text-sm truncate">{textContent}</span>
            </div>
          )
        })}

        {completedCount > 0 && (
          <div className="text-xs text-muted-foreground pt-2">
            +{completedCount} completed item{completedCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  )
}
