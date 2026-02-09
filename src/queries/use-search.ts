'use client'

import { useQuery } from '@tanstack/react-query'

import { useSupabase } from '@/components/providers/supabase-provider'
import { globalSearch } from '@/services/search-service'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_MIN_LENGTH = 2

export const searchKeys = {
  query: (q: string) => ['search', q] as const,
}

export function useSearch(query: string) {
  const supabase = useSupabase()
  const trimmed = query.trim()

  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: searchKeys.query(trimmed),
    queryFn: async () => {
      const result = await globalSearch(supabase, trimmed)
      if (result.error) throw new Error(result.error.message)
      return result.data
    },
    enabled: trimmed.length >= SEARCH_MIN_LENGTH,
    staleTime: SEARCH_DEBOUNCE_MS,
    gcTime: 1000 * 60 * 5,
  })
}
