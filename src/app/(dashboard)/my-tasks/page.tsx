import { MyTasksView } from '@/components/my-tasks/my-tasks-view'

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">내 할 일</h1>
        <p className="text-muted-foreground text-sm">나에게 배정된 모든 태스크를 모아봅니다</p>
      </div>
      <MyTasksView />
    </div>
  )
}
