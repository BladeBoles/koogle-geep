'use client'

import { useState } from 'react'
import { Note } from '@/lib/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MoreVertical, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2 } from 'lucide-react'
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
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'

interface NoteEditModalProps {
  note: Note
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (note: Note) => void
  onDelete: () => void
  onArchive: () => void
}

export function NoteEditModal({ note, open, onOpenChange, onUpdate, onDelete, onArchive }: NoteEditModalProps) {
  const [title, setTitle] = useState(note.title || '')
  const [content, setContent] = useState(note.content || '')

  // Save changes when modal closes
  const handleClose = (open: boolean) => {
    if (!open) {
      // Save final state
      onUpdate({ ...note, title, content })
    }
    onOpenChange(open)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Take a note...',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 whitespace-pre-wrap',
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {title || 'Edit Note'}
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

        <div className="mt-4">
          <EditorContent editor={editor} />
        </div>

        <div className="px-2 pb-2 pt-1 flex items-center gap-1 border-t">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              editor.isActive('bold') && 'bg-muted'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleBold().run()
            }}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              editor.isActive('italic') && 'bg-muted'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleItalic().run()
            }}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              editor.isActive('underline') && 'bg-muted'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleUnderline().run()
            }}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              editor.isActive('heading', { level: 1 }) && 'bg-muted'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 cursor-pointer',
              editor.isActive('heading', { level: 2 }) && 'bg-muted'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
