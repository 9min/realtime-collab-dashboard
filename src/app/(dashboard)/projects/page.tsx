import type { Metadata } from 'next'

import { ProjectList } from '@/components/project/project-list'

export const metadata: Metadata = {
  title: '프로젝트 | 실시간 협업보드',
}

export default function ProjectsPage() {
  return <ProjectList />
}
