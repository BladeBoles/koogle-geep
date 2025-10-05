'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Note } from '@/lib/types/database'

export async function createNote() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: '',
      content: '',
      position: 0,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { data }
}

export async function updateNote(note: Note) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    title: note.title,
    content: note.content,
    position: note.position,
  }

  if (note.is_pinned !== undefined) updateData.is_pinned = note.is_pinned
  if (note.sort_order !== undefined) updateData.sort_order = note.sort_order

  const { error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', note.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function togglePinNote(id: string, isPinned: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .update({ is_pinned: isPinned })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function updateNoteOrder(notes: { id: string; sort_order: number }[]) {
  const supabase = await createClient()

  const updates = notes.map(note =>
    supabase
      .from('notes')
      .update({ sort_order: note.sort_order })
      .eq('id', note.id)
  )

  await Promise.all(updates)
  revalidatePath('/app')
  return { success: true }
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function archiveNote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notes')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}
