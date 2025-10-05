'use client'

import { useEffect, useState } from 'react'
import { ListPreviewCard } from '@/components/list-preview-card'
import { NotePreviewCard } from '@/components/note-preview-card'
import { ListEditModal } from '@/components/list-edit-modal'
import { NoteEditModal } from '@/components/note-edit-modal'
import { Button } from '@/components/ui/button'
import { List, FileText, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { ListWithItems, Note } from '@/lib/types/database'
import { createList, updateList, deleteList, archiveList, togglePinList } from '@/app/actions/lists'
import { createNote, updateNote, deleteNote, archiveNote, togglePinNote } from '@/app/actions/notes'

type SortOption = 'title-asc' | 'title-desc' | 'created-asc' | 'created-desc' | 'updated-asc' | 'updated-desc'

export default function AppPage() {
  const [lists, setLists] = useState<ListWithItems[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [editingList, setEditingList] = useState<ListWithItems | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc')

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

    // Fetch notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*')
      .eq('is_archived', false)

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

  const handleTogglePinList = async (id: string, isPinned?: boolean) => {
    await togglePinList(id, !(isPinned ?? false))
    loadData()
  }

  const handleTogglePinNote = async (id: string, isPinned?: boolean) => {
    await togglePinNote(id, !(isPinned ?? false))
    loadData()
  }

  const sortItems = (items: Array<{ type: 'list' | 'note', id: string, data: ListWithItems | Note, sort_order: number }>) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case 'title-asc':
          return (a.data.title || '').localeCompare(b.data.title || '')
        case 'title-desc':
          return (b.data.title || '').localeCompare(a.data.title || '')
        case 'created-asc':
          return new Date(a.data.created_at).getTime() - new Date(b.data.created_at).getTime()
        case 'created-desc':
          return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
        case 'updated-asc':
          return new Date(a.data.updated_at).getTime() - new Date(b.data.updated_at).getTime()
        case 'updated-desc':
          return new Date(b.data.updated_at).getTime() - new Date(a.data.updated_at).getTime()
        default:
          return 0
      }
    })
  }

  // Combine and separate by pinned status
  const items = [
    ...lists.map(l => ({
      type: 'list' as const,
      id: l.id,
      data: { ...l, is_pinned: l.is_pinned ?? false, sort_order: l.sort_order ?? 0 },
      sort_order: l.sort_order ?? 0
    })),
    ...notes.map(n => ({
      type: 'note' as const,
      id: n.id,
      data: { ...n, is_pinned: n.is_pinned ?? false, sort_order: n.sort_order ?? 0 },
      sort_order: n.sort_order ?? 0
    })),
  ]

  const pinnedItems = sortItems(items.filter(i => i.data.is_pinned))
  const unpinnedItems = sortItems(items.filter(i => !i.data.is_pinned))

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
        <div className="flex justify-center items-center gap-3 mb-8">
          <Button size="lg" className="rounded-full cursor-pointer" onClick={handleCreateNote}>
            <FileText className="h-5 w-5 mr-2" />
            New Note
          </Button>

          <Button size="lg" className="rounded-full cursor-pointer" onClick={handleCreateList}>
            <List className="h-5 w-5 mr-2" />
            New List
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('title-asc')} className="cursor-pointer">
                Title (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title-desc')} className="cursor-pointer">
                Title (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('created-asc')} className="cursor-pointer">
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('created-desc')} className="cursor-pointer">
                Newest first
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy('updated-asc')} className="cursor-pointer">
                Last updated (oldest)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('updated-desc')} className="cursor-pointer">
                Last updated (newest)
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
          <>
            {pinnedItems.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Pinned</h2>
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {pinnedItems.map(item =>
                    item.type === 'list' ? (
                      <ListPreviewCard
                        key={item.id}
                        list={item.data as ListWithItems}
                        onClick={() => setEditingList(item.data as ListWithItems)}
                        onPin={() => handleTogglePinList(item.id, item.data.is_pinned)}
                        onArchive={() => handleArchiveList(item.id)}
                        onDelete={() => handleDeleteList(item.id)}
                      />
                    ) : (
                      <NotePreviewCard
                        key={item.id}
                        note={item.data as Note}
                        onClick={() => setEditingNote(item.data as Note)}
                        onPin={() => handleTogglePinNote(item.id, item.data.is_pinned)}
                        onArchive={() => handleArchiveNote(item.id)}
                        onDelete={() => handleDeleteNote(item.id)}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {unpinnedItems.length > 0 && (
              <div>
                {pinnedItems.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">Others</h2>
                )}
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {unpinnedItems.map(item =>
                    item.type === 'list' ? (
                      <ListPreviewCard
                        key={item.id}
                        list={item.data as ListWithItems}
                        onClick={() => setEditingList(item.data as ListWithItems)}
                        onPin={() => handleTogglePinList(item.id, item.data.is_pinned)}
                        onArchive={() => handleArchiveList(item.id)}
                        onDelete={() => handleDeleteList(item.id)}
                      />
                    ) : (
                      <NotePreviewCard
                        key={item.id}
                        note={item.data as Note}
                        onClick={() => setEditingNote(item.data as Note)}
                        onPin={() => handleTogglePinNote(item.id, item.data.is_pinned)}
                        onArchive={() => handleArchiveNote(item.id)}
                        onDelete={() => handleDeleteNote(item.id)}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </>
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
          onTogglePin={() => handleTogglePinList(editingList.id, editingList.is_pinned)}
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
          onTogglePin={() => handleTogglePinNote(editingNote.id, editingNote.is_pinned)}
        />
      )}
    </>
  )
}
