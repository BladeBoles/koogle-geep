export interface List {
  id: string
  user_id: string
  title: string | null
  position: number
  is_archived: boolean
  is_pinned?: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  content: string
  is_completed: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string | null
  content: string | null
  position: number
  is_archived: boolean
  is_pinned?: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface ListWithItems extends List {
  list_items: ListItem[]
}
