'use client'

import { useEffect, useRef } from 'react'
import { Play, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTimerStore } from '@/stores/timer-store'
import { useCreateTimeEntry } from '@/queries/use-time-entries'
import { useAuth } from '@/hooks/use-auth'

const TICK_INTERVAL_MS = 1000

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

interface TimerWidgetProps {
  taskId: string
  projectId: string
}

export function TimerWidget({ taskId, projectId }: TimerWidgetProps) {
  const { user } = useAuth()
  const { activeTaskId, isRunning, elapsedSeconds, startTimer, stopTimer, tick } = useTimerStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const createTimeEntry = useCreateTimeEntry(projectId)

  const isThisTaskRunning = isRunning && activeTaskId === taskId

  useEffect(() => {
    if (isThisTaskRunning) {
      intervalRef.current = setInterval(tick, TICK_INTERVAL_MS)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isThisTaskRunning, tick])

  const handleStart = () => {
    startTimer(taskId, projectId)
  }

  const handleStop = () => {
    const result = stopTimer()
    if (result && user) {
      createTimeEntry.mutate({
        task_id: result.taskId,
        project_id: result.projectId,
        duration_minutes: result.durationMinutes,
        user_id: user.id,
        started_at: new Date(Date.now() - result.durationMinutes * 60 * 1000).toISOString(),
        ended_at: new Date().toISOString(),
      })
    }
  }

  const isOtherTaskRunning = isRunning && activeTaskId !== taskId

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm tabular-nums">
        {isThisTaskRunning ? formatElapsed(elapsedSeconds) : '00:00:00'}
      </span>
      {isThisTaskRunning ? (
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={handleStop}
          aria-label="타이머 정지"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={handleStart}
          disabled={isOtherTaskRunning}
          aria-label="타이머 시작"
        >
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
