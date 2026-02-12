import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/database'

import { DEMO_USER_ID } from './constants'
import { demoDataStore } from './demo-store'
import { createMockQueryBuilder } from './mock-query-builder'
import { createMockAuth } from './mock-auth'
import { createMockRealtimeChannel, createMockRealtime } from './mock-realtime'

function createMockStorage() {
  return {
    from: (_bucket: string) => ({
      upload: async (_path: string, _file: unknown) => ({
        data: { path: `demo-upload-${Date.now()}` },
        error: null,
      }),
      remove: async (_paths: string[]) => ({
        data: [],
        error: null,
      }),
      getPublicUrl: (path: string) => {
        const isImage = /\.(jpe?g|png|gif|webp|svg)$/i.test(path)
        return {
          data: { publicUrl: isImage ? '/demo-placeholder.svg' : `/demo-storage/${path}` },
        }
      },
      download: async () => ({
        data: new Blob([]),
        error: null,
      }),
      list: async () => ({
        data: [],
        error: null,
      }),
    }),
  }
}

function handleRpc(fnName: string, params: Record<string, unknown>): { data: unknown; error: null } {
  switch (fnName) {
    case 'create_project_with_defaults': {
      const projectId = `demo-proj-${Date.now()}`
      const now = new Date().toISOString()

      demoDataStore.insertRow('projects', {
        id: projectId,
        name: params['p_name'] as string,
        description: params['p_description'] as string | null,
        owner_id: DEMO_USER_ID,
        feature_labels: true,
        feature_subtasks: true,
        feature_dependencies: true,
        feature_attachments: true,
        feature_comments: true,
        created_at: now,
        updated_at: now,
      })

      demoDataStore.insertRow('project_members', {
        id: `demo-pm-${Date.now()}`,
        project_id: projectId,
        user_id: DEMO_USER_ID,
        role: 'owner',
        joined_at: now,
      })

      // 기본 컬럼 생성
      const defaultCols = [
        { title: '할 일', position: 0, is_done_column: false },
        { title: '진행 중', position: 1, is_done_column: false },
        { title: '완료', position: 2, is_done_column: true },
        { title: '논의 필요', position: 3, is_done_column: false },
      ]
      for (const col of defaultCols) {
        demoDataStore.insertRow('kanban_columns', {
          id: `demo-col-${Date.now()}-${col.position}`,
          project_id: projectId,
          title: col.title,
          position: col.position,
          wip_limit: null,
          is_done_column: col.is_done_column,
          created_at: now,
          updated_at: now,
        })
      }

      // 기본 라벨 생성
      const defaultLabels = [
        { name: 'Bug', color: '#EF4444' },
        { name: 'Design', color: '#8B5CF6' },
        { name: 'Docs', color: '#22C55E' },
        { name: 'Feature', color: '#3B82F6' },
      ]
      for (const label of defaultLabels) {
        demoDataStore.insertRow('labels', {
          project_id: projectId,
          name: label.name,
          color: label.color,
          created_at: now,
        })
      }

      return { data: projectId, error: null }
    }

    case 'set_admin_status': {
      demoDataStore.updateRows('profiles', [['id', 'eq', params['p_user_id']]], {
        is_admin: params['p_is_admin'],
      })
      return { data: null, error: null }
    }

    case 'has_project_role': {
      const projectId = params['p_project_id'] as string
      const roles = params['p_roles'] as string[]
      const members = demoDataStore.getTable('project_members')
      const member = members.find(
        (m) => m['project_id'] === projectId && m['user_id'] === DEMO_USER_ID,
      )
      return { data: member ? roles.includes(member['role'] as string) : false, error: null }
    }

    case 'is_admin': {
      const profiles = demoDataStore.getTable('profiles')
      const profile = profiles.find((p) => p['id'] === DEMO_USER_ID)
      return { data: profile?.['is_admin'] ?? false, error: null }
    }

    case 'is_project_member': {
      const projectId = params['p_project_id'] as string
      const members = demoDataStore.getTable('project_members')
      const isMember = members.some(
        (m) => m['project_id'] === projectId && m['user_id'] === DEMO_USER_ID,
      )
      return { data: isMember, error: null }
    }

    case 'get_all_project_memberships': {
      const members = demoDataStore.getTable('project_members')
      const projects = demoDataStore.getTable('projects')
      const result = members.map((m) => {
        const project = projects.find((p) => p['id'] === m['project_id'])
        return {
          user_id: m['user_id'],
          project_id: m['project_id'],
          project_name: project?.['name'] ?? '',
          role: m['role'],
          joined_at: m['joined_at'],
        }
      })
      return { data: result, error: null }
    }

    default:
      return { data: null, error: null }
  }
}

const channels = new Map<string, ReturnType<typeof createMockRealtimeChannel>>()

export function createMockSupabaseClient(): SupabaseClient<Database> {
  const mockAuth = createMockAuth()
  const mockStorage = createMockStorage()
  const mockRealtime = createMockRealtime()

  const client = {
    from: (table: string) => createMockQueryBuilder(table),

    auth: mockAuth,

    storage: mockStorage,

    realtime: mockRealtime,

    channel: (name: string) => {
      const ch = createMockRealtimeChannel(name)
      channels.set(name, ch)
      return ch
    },

    removeChannel: (channel: unknown) => {
      // 채널 맵에서 제거
      for (const [name, ch] of channels.entries()) {
        if (ch === channel) {
          channels.delete(name)
          break
        }
      }
      return Promise.resolve()
    },

    rpc: async (fnName: string, params?: Record<string, unknown>) => {
      return handleRpc(fnName, params ?? {})
    },
  }

  return client as unknown as SupabaseClient<Database>
}
