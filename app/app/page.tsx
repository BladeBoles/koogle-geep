'use client'

import { useEffect, useState } from 'react'
import { ListPreviewCard } from '@/components/list-preview-card'
import { NotePreviewCard } from '@/components/note-preview-card'
import { ListEditModal } from '@/components/list-edit-modal'
import { NoteEditModal } from '@/components/note-edit-modal'
import { Button } from '@/components/ui/button'
import { Plus, List, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { ListWithItems, Note } from '@/lib/types/database'
import { createList, updateList, deleteList, archiveList } from '@/app/actions/lists'
import { createNote, updateNote, deleteNote, archiveNote } from '@/app/actions/notes'

export default function AppPage() {
  const [lists, setLists] = useState<ListWithItems[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingList, setEditingList] = useState<ListWithItems | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  useEffect(() => {
    loadData()

    const supabase = createClient()

    // Subscribe to real-time changes
    const listsChannel = supabase
      .channel('lists-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_items' }, () => {
        loadData()
      })
      .subscribe()

    const notesChannel = supabase
      .channel('notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(notesChannel)
    }
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Fetch lists with items
    const { data: listsData } = await supabase
      .from('lists')
      .select('*, list_items(*)')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    // Fetch notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })

    setLists(listsData as ListWithItems[] || [])
    setNotes(notesData || [])
    setLoading(false)
  }

  const handleCreateList = async () => {
    const result = await createList()
    if (!result.error && result.data) {
      await loadData()
      // Open the newly created list in edit modal
      const newList: ListWithItems = {
        ...result.data,
        list_items: []
      }
      setEditingList(newList)
    }
  }

  const handleCreateNote = async () => {
    const result = await createNote()
    if (!result.error && result.data) {
      await loadData()
      // Open the newly created note in edit modal
      setEditingNote(result.data)
    }
  }

  const handleUpdateList = async (list: ListWithItems) => {
    await updateList(list)
    // Update local state immediately for responsiveness
    setLists(prev => prev.map(l => l.id === list.id ? list : l))
  }

  const handleUpdateNote = async (note: Note) => {
    await updateNote(note)
    // Update local state immediately for responsiveness
    setNotes(prev => prev.map(n => n.id === note.id ? note : n))
  }

  const handleDeleteList = async (id: string) => {
    await deleteList(id)
    setEditingList(null)
    loadData()
  }

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id)
    setEditingNote(null)
    loadData()
  }

  const handleArchiveList = async (id: string) => {
    await archiveList(id)
    setEditingList(null)
    loadData()
  }

  const handleArchiveNote = async (id: string) => {
    await archiveNote(id)
    setEditingNote(null)
    loadData()
  }

  // Combine and sort by updated_at
  const items = [
    ...lists.map(l => ({ type: 'list' as const, data: l, updated_at: l.updated_at })),
    ...notes.map(n => ({ type: 'note' as const, data: n, updated_at: n.updated_at })),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" className="rounded-full cursor-pointer">
                <Plus className="h-5 w-5 mr-2" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleCreateNote} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2" />
                Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateList} className="cursor-pointer">
                <List className="h-4 w-4 mr-2" />
                List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg mb-2">No notes or lists yet</p>
            <p className="text-sm">Click the button above to create your first note or list</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {items.map(item =>
              item.type === 'list' ? (
                <ListPreviewCard
                  key={item.data.id}
                  list={item.data}
                  onClick={() => setEditingList(item.data)}
                />
              ) : (
                <NotePreviewCard
                  key={item.data.id}
                  note={item.data}
                  onClick={() => setEditingNote(item.data)}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* Edit Modals */}
      {editingList && (
        <ListEditModal
          list={editingList}
          open={!!editingList}
          onOpenChange={(open) => !open && setEditingList(null)}
          onUpdate={handleUpdateList}
          onDelete={() => handleDeleteList(editingList.id)}
          onArchive={() => handleArchiveList(editingList.id)}
        />
      )}

      {editingNote && (
        <NoteEditModal
          note={editingNote}
          open={!!editingNote}
          onOpenChange={(open) => !open && setEditingNote(null)}
          onUpdate={handleUpdateNote}
          onDelete={() => handleDeleteNote(editingNote.id)}
          onArchive={() => handleArchiveNote(editingNote.id)}
        />
      )}
    </>
  )
}
