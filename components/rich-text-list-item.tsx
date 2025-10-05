'use client'

import { useEffect, useRef } from 'react'
import { ListItem } from '@/lib/types/database'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { GripVertical, X } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface RichTextListItemProps {
  item: ListItem
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onContentChange: (id: string, content: string) => void
  onEnter: (id: string) => void
  onBackspace: (id: string) => void
  autoFocus?: boolean
}

export function RichTextListItem({
  item,
  onToggle,
  onDelete,
  onContentChange,
  onEnter,
  onBackspace,
  autoFocus = false,
}: RichTextListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'List item',
      }),
    ],
    content: item.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-sm flex-1 min-h-[1.5rem] whitespace-pre-wrap break-words',
      },
      handleKeyDown: (view, event) => {
        // Enter key - create new item
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onEnter(item.id)
          return true
        }

        // Backspace on empty item - delete it
        if (event.key === 'Backspace') {
          const isEmpty = view.state.doc.textContent.trim() === ''
          if (isEmpty && view.state.selection.anchor === 1) {
            event.preventDefault()
            onBackspace(item.id)
            return true
          }
        }

        return false
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(item.id, editor.getHTML())
    },
  })

  useEffect(() => {
    if (autoFocus && editor) {
      // Focus at the end of the editor
      setTimeout(() => {
        editor.commands.focus('end')
      }, 0)
    }
  }, [autoFocus, editor])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!editor) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 group py-1"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground mt-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={item.is_completed}
        onCheckedChange={() => onToggle(item.id)}
        className="cursor-pointer mt-1"
      />
      <div
        ref={editorRef}
        className={`flex-1 ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}
      >
        <EditorContent editor={editor} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 cursor-pointer mt-0.5"
        onClick={() => onDelete(item.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
