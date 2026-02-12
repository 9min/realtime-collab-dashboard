'use client'

import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useFavoriteIds, useToggleFavorite } from '@/queries/use-favorites'

interface FavoriteButtonProps {
  taskId: string
  size?: 'sm' | 'default'
  className?: string
}

export function FavoriteButton({ taskId, size = 'sm', className }: FavoriteButtonProps) {
  const { user } = useAuth()
  const { data: favoriteIds } = useFavoriteIds(user?.id)
  const toggleFavorite = useToggleFavorite(user?.id)

  const isFavorite = favoriteIds?.has(taskId) ?? false

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite.mutate({ taskId, isFavorite })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'shrink-0',
              size === 'sm' ? 'h-6 w-6' : 'h-8 w-8',
              className,
            )}
            onClick={handleToggle}
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Star
              className={cn(
                size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
                isFavorite && 'fill-amber-400 text-amber-400',
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
