'use client'

import { ListWithItems } from '@/lib/types/database'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

interface ListPreviewCardProps {
  list: ListWithItems
  onClick: () => void
}

export function ListPreviewCard({ list, onClick }: ListPreviewCardProps) {
  const activeItems = list.list_items
    .filter(item => !item.is_completed)
    .sort((a, b) => a.position - b.position)
    .slice(0, 5) // Show max 5 items in preview

  const completedCount = list.list_items.filter(item => item.is_completed).length

  return (
    <Card
      className="p-4 break-inside-avoid mb-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      {list.title && (
        <h3 className="font-medium mb-2 text-base">{list.title}</h3>
      )}

      <div className="space-y-1">
        {activeItems.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox checked={false} disabled className="pointer-events-none" />
            <span className="text-sm truncate">{item.content}</span>
          </div>
        ))}

        {completedCount > 0 && (
          <div className="text-xs text-muted-foreground pt-2">
            +{completedCount} completed item{completedCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  )
}
