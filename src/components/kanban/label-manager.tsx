'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LABEL_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '@/queries/use-labels'

interface LabelManagerProps {
  projectId: string
}

export function LabelManager({ projectId }: LabelManagerProps) {
  const { data: labels, isLoading } = useLabels(projectId)
  const createMutation = useCreateLabel(projectId)
  const updateMutation = useUpdateLabel(projectId)
  const deleteMutation = useDeleteLabel(projectId)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(LABEL_COLORS[0].value)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return

    createMutation.mutate(
      { project_id: projectId, name: trimmed, color: newColor },
      {
        onSuccess: () => {
          setNewName('')
          setShowCreate(false)
        },
      },
    )
  }

  const handleStartEdit = (label: { id: string; name: string; color: string }) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  const handleSaveEdit = () => {
    if (!editingId) return
    const trimmed = editName.trim()
    if (!trimmed) return

    updateMutation.mutate(
      { labelId: editingId, input: { name: trimmed, color: editColor } },
      { onSuccess: () => setEditingId(null) },
    )
  }

  const handleDelete = (labelId: string) => {
    deleteMutation.mutate(labelId)
  }

  if (isLoading) {
    return <div className="bg-muted h-20 animate-pulse rounded" />
  }

  return (
    <div className="space-y-3">
      {/* 라벨 목록 */}
      {labels && labels.length > 0 && (
        <div className="space-y-2">
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2">
              {editingId === label.id ? (
                <>
                  <ColorSelect value={editColor} onChange={setEditColor} />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 flex-1 text-sm"
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <Button size="sm" className="h-8" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                    저장
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingId(null)}>
                    취소
                  </Button>
                </>
              ) : (
                <>
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-sm">{label.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(label)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-7 w-7"
                    onClick={() => handleDelete(label.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 라벨 추가 */}
      {showCreate ? (
        <div className="flex items-center gap-2">
          <ColorSelect value={newColor} onChange={setNewColor} />
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="라벨 이름"
            className="h-8 flex-1 text-sm"
            maxLength={30}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') setShowCreate(false)
            }}
          />
          <Button size="sm" className="h-8" onClick={handleCreate} disabled={createMutation.isPending || !newName.trim()}>
            추가
          </Button>
          <Button variant="ghost" size="sm" className="h-8" onClick={() => setShowCreate(false)}>
            취소
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3" />
          라벨 추가
        </Button>
      )}
    </div>
  )
}

function ColorSelect({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex gap-1">
      {LABEL_COLORS.map((c) => (
        <button
          key={c.value}
          className={cn(
            'h-5 w-5 rounded-full border-2 transition-all',
            value === c.value ? 'border-foreground scale-110' : 'border-transparent',
          )}
          style={{ backgroundColor: c.value }}
          onClick={() => onChange(c.value)}
          title={c.name}
          type="button"
        />
      ))}
    </div>
  )
}
