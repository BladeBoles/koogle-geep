'use client'

import { useState } from 'react'
import { ListWithItems, ListItem } from '@/lib/types/database'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { GripVertical, X, MoreVertical } from 'lucide-react'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ListEditModalProps {
  list: ListWithItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (list: ListWithItems) => void
  onDelete: () => void
  onArchive: () => void
}

interface SortableItemProps {
  item: ListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onContentChange: (id: string, content: string) => void
}

function SortableItem({ item, onToggle, onDelete, onContentChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 group py-1"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={() => onToggle(item.id)}
        className="cursor-pointer"
      />
      <Input
        value={item.content}
        onChange={(e) => onContentChange(item.id, e.target.value)}
        className={`flex-1 border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 ${
          item.is_completed ? 'line-through text-muted-foreground' : ''
        }`}
        placeholder="List item"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={() => onDelete(item.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ListEditModal({ list, open, onOpenChange, onUpdate, onDelete, onArchive }: ListEditModalProps) {
  const [title, setTitle] = useState(list.title || '')
  const [items, setItems] = useState<ListItem[]>(list.list_items)
  const [newItemContent, setNewItemContent] = useState('')

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

  const handleAddItem = () => {
    if (!newItemContent.trim()) return

    const newItem: ListItem = {
      id: crypto.randomUUID(),
      list_id: list.id,
      content: newItemContent,
      is_completed: false,
      position: activeItems.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    setNewItemContent('')
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
                <SortableItem
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDeleteItem}
                  onContentChange={handleContentChange}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="flex items-center gap-2 py-1 pl-6">
            <Checkbox disabled className="invisible" />
            <Input
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
              placeholder="List item"
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            />
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
                    <SortableItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDeleteItem}
                      onContentChange={handleContentChange}
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
