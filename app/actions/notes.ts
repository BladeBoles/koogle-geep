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

  const { error } = await supabase
    .from('notes')
    .update({
      title: note.title,
      content: note.content,
      position: note.position,
    })
    .eq('id', note.id)

  if (error) {
    return { error: error.message }
  }

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
