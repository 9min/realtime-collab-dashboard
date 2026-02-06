import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '프로젝트 | Realtime Collab Dashboard',
}

// TODO: F2 Project Management 구현 시 프로젝트 목록 UI 추가
export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">프로젝트</h1>
      <p className="text-muted-foreground mt-2">참여 중인 프로젝트 목록</p>
    </div>
  )
}
