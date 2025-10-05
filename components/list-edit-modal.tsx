'use client'

import { useState } from 'react'
import { ListWithItems, ListItem } from '@/lib/types/database'
import { RichTextListItem } from '@/components/rich-text-list-item'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface ListEditModalProps {
  list: ListWithItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (list: ListWithItems) => void
  onDelete: () => void
  onArchive: () => void
  onTogglePin: () => void
}


export function ListEditModal({ list, open, onOpenChange, onUpdate, onDelete, onArchive, onTogglePin }: ListEditModalProps) {
  const [title, setTitle] = useState(list.title || '')
  const [items, setItems] = useState<ListItem[]>(list.list_items)
  const [autoFocusItemId, setAutoFocusItemId] = useState<string | null>(null)

  const handleTitleTab = () => {
    const activeItems = items.filter(item => !item.is_completed).sort((a, b) => a.position - b.position)

    if (activeItems.length > 0) {
      // Focus first item
      setAutoFocusItemId(activeItems[0].id)
      setTimeout(() => setAutoFocusItemId(null), 100)
    } else {
      // Create a new item if none exist
      const newItem: ListItem = {
        id: crypto.randomUUID(),
        list_id: list.id,
        content: '',
        is_completed: false,
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setItems([...items, newItem])
      setAutoFocusItemId(newItem.id)
      setTimeout(() => setAutoFocusItemId(null), 100)
    }
  }

  // Save changes when modal closes
  const handleClose = (open: boolean) => {
    if (!open) {
      // Save final state
      onUpdate({ ...list, title, list_items: items })
    }
    onOpenChange(open)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activeItems = items.filter(item => !item.is_completed).sort((a, b) => a.position - b.position)
  const completedItems = items.filter(item => item.is_completed).sort((a, b) => a.position - b.position)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const isActiveCompleted = items.find(i => i.id === active.id)?.is_completed
      const relevantItems = isActiveCompleted ? completedItems : activeItems

      const oldIndex = relevantItems.findIndex(i => i.id === active.id)
      const newIndex = relevantItems.findIndex(i => i.id === over.id)

      const reorderedItems = arrayMove(relevantItems, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        position: idx,
      }))

      const otherItems = isActiveCompleted ? activeItems : completedItems
      const updatedItems = [...reorderedItems, ...otherItems]

      setItems(updatedItems)
    }
  }

  const handleToggle = (id: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, is_completed: !item.is_completed } : item
    )
    setItems(updatedItems)
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)
  }

  const handleContentChange = (id: string, content: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, content } : item
    )
    setItems(updatedItems)
  }

  const handleEnter = (id: string) => {
    // Create new item after the current one
    const currentItem = items.find(item => item.id === id)
    if (!currentItem) return

    const isCompleted = currentItem.is_completed
    const relevantItems = items.filter(item => item.is_completed === isCompleted)
    const currentIndex = relevantItems.findIndex(item => item.id === id)

    const newItem: ListItem = {
      id: crypto.randomUUID(),
      list_id: list.id,
      content: '',
      is_completed: isCompleted,
      position: currentIndex + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert new item and update positions
    const otherItems = items.filter(item => item.is_completed !== isCompleted)
    const updatedRelevantItems = [
      ...relevantItems.slice(0, currentIndex + 1),
      newItem,
      ...relevantItems.slice(currentIndex + 1),
    ].map((item, idx) => ({ ...item, position: idx }))

    setItems([...updatedRelevantItems, ...otherItems])
    setAutoFocusItemId(newItem.id)
    setTimeout(() => setAutoFocusItemId(null), 100)
  }

  const handleBackspace = (id: string) => {
    // Delete item and focus previous
    const currentItem = items.find(item => item.id === id)
    if (!currentItem) return

    const isCompleted = currentItem.is_completed
    const relevantItems = items.filter(item => item.is_completed === isCompleted)
    const currentIndex = relevantItems.findIndex(item => item.id === id)

    // Don't delete if it's the only item
    if (relevantItems.length === 1) return

    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)

    // Focus previous item if exists
    if (currentIndex > 0) {
      setAutoFocusItemId(relevantItems[currentIndex - 1].id)
      setTimeout(() => setAutoFocusItemId(null), 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {title || 'Edit List'}
          </DialogTitle>
          <div className="flex items-start justify-between">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault()
                  handleTitleTab()
                }
              }}
              placeholder="Title"
              className="border-0 p-0 text-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { onTogglePin(); onOpenChange(false); }} className="cursor-pointer">
                  {list.is_pinned ?? false ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onArchive(); onOpenChange(false); }} className="cursor-pointer">
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { onDelete(); onOpenChange(false); }} className="text-destructive cursor-pointer">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="space-y-1 mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {activeItems.map(item => (
                <RichTextListItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDeleteItem}
                  onContentChange={handleContentChange}
                  onEnter={handleEnter}
                  onBackspace={handleBackspace}
                  autoFocus={item.id === autoFocusItemId}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div
            className="flex items-center gap-2 py-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => {
              const newItem: ListItem = {
                id: crypto.randomUUID(),
                list_id: list.id,
                content: '',
                is_completed: false,
                position: activeItems.length,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              setItems([...items, newItem])
              setAutoFocusItemId(newItem.id)
              setTimeout(() => setAutoFocusItemId(null), 100)
            }}
          >
            <div className="w-4 h-4 flex items-center justify-center text-lg leading-none ml-[18px]">+</div>
            <span className="text-sm">List item</span>
          </div>

          {completedItems.length > 0 && (
            <>
              <div className="pt-3 pb-1 text-sm text-muted-foreground">
                {completedItems.length} Completed item{completedItems.length !== 1 ? 's' : ''}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={completedItems.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {completedItems.map(item => (
                    <RichTextListItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDeleteItem}
                      onContentChange={handleContentChange}
                      onEnter={handleEnter}
                      onBackspace={handleBackspace}
                      autoFocus={item.id === autoFocusItemId}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
