import { WIDGET_TYPE } from '@/lib/constants'

import type { WidgetType } from './common'

// 위젯 레이아웃 아이템
export interface WidgetLayoutItem {
  widget_id: string
  type: WidgetType
  x: number
  y: number
  w: number
  h: number
}

// 위젯 설정
export interface WidgetConfig {
  type: WidgetType
  title: string
  description: string
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
}

// 사용 가능한 위젯 목록
export const WIDGET_REGISTRY: WidgetConfig[] = [
  {
    type: WIDGET_TYPE.TASK_STATUS,
    title: '태스크 상태 분포',
    description: '컬럼별 태스크 수를 파이 차트로 표시',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    type: WIDGET_TYPE.WEEKLY_PROGRESS,
    title: '주간 진행률',
    description: '최근 7일간 완료된 태스크 추이',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    type: WIDGET_TYPE.BURNDOWN,
    title: '번다운 차트',
    description: '남은 태스크 대비 시간 경과',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    type: WIDGET_TYPE.MEMBER_LIST,
    title: '프로젝트 멤버',
    description: '프로젝트 참여 멤버 목록',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    type: WIDGET_TYPE.MY_FAVORITES,
    title: '즐겨찾기',
    description: '즐겨찾기한 태스크 목록',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
]

// 차트 데이터 타입
export interface TaskStatusData {
  name: string
  value: number
  color: string
}

export interface WeeklyProgressData {
  date: string
  completed: number
  created: number
}

export interface BurndownData {
  date: string
  remaining: number
  ideal: number
}
