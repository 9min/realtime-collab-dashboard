import type { TASK_PRIORITY, MEMBER_ROLE, WIDGET_TYPE, SWIMLANE_MODE } from '@/lib/constants'

// 유틸리티 타입
export type ValueOf<T> = T[keyof T]

// 상수 기반 유니온 타입
export type TaskPriority = ValueOf<typeof TASK_PRIORITY>
export type MemberRole = ValueOf<typeof MEMBER_ROLE>
export type WidgetType = ValueOf<typeof WIDGET_TYPE>
export type SwimlaneMode = ValueOf<typeof SWIMLANE_MODE>

// 서비스 레이어 결과 타입
export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string } }

// 페이지네이션
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
