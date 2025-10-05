'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ListWithItems, ListItem } from '@/lib/types/database'

export async function createList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('lists')
    .insert({
      user_id: user.id,
      title: '',
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

export async function updateList(list: ListWithItems) {
  const supabase = await createClient()

  // Update list metadata
  const { error: listError } = await supabase
    .from('lists')
    .update({
      title: list.title,
      position: list.position,
    })
    .eq('id', list.id)

  if (listError) {
    return { error: listError.message }
  }

  // Get existing items
  const { data: existingItems } = await supabase
    .from('list_items')
    .select('id')
    .eq('list_id', list.id)

  const existingIds = new Set(existingItems?.map(i => i.id) || [])
  const currentIds = new Set(list.list_items.map(i => i.id))

  // Delete removed items
  const toDelete = [...existingIds].filter(id => !currentIds.has(id))
  if (toDelete.length > 0) {
    await supabase
      .from('list_items')
      .delete()
      .in('id', toDelete)
  }

  // Upsert all current items
  if (list.list_items.length > 0) {
    const { error: itemsError } = await supabase
      .from('list_items')
      .upsert(
        list.list_items.map(item => ({
          id: item.id,
          list_id: list.id,
          content: item.content,
          is_completed: item.is_completed,
          position: item.position,
        }))
      )

    if (itemsError) {
      return { error: itemsError.message }
    }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function deleteList(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function archiveList(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('lists')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}
