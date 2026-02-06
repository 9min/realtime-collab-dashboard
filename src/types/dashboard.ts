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
  defaultSize: { w: number; h: number }
  minSize: { w: number; h: number }
}
