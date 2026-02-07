// Supabase CLI로 자동 생성되는 파일
// 초기 세팅 단계에서는 placeholder로 유지
// 실제 타입은 `pnpm supabase:gen-types` 실행 후 교체

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          project_id: string
          user_id: string
          action_type: string
          entity_type: string
          entity_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          action_type: string
          entity_type: string
          entity_id: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'admin' | 'member' | 'viewer'
        }
        Relationships: [
          {
            foreignKeyName: 'project_members_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'project_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      kanban_columns: {
        Row: {
          id: string
          project_id: string
          title: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kanban_columns_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          column_id: string
          title: string
          description: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          assignee_id: string | null
          position: number
          due_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          column_id: string
          title: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assignee_id?: string | null
          position: number
          due_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          assignee_id?: string | null
          position?: number
          due_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_column_id_fkey'
            columns: ['column_id']
            isOneToOne: false
            referencedRelation: 'kanban_columns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          project_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_comments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          id: string
          project_id: string
          user_id: string
          layout: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          layout?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          layout?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dashboard_layouts_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'dashboard_layouts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      create_project_with_defaults: {
        Args: { p_name: string; p_description?: string | null }
        Returns: string // UUID
      }
      has_project_role: {
        Args: { p_project_id: string; p_roles: Database['public']['Enums']['member_role'][] }
        Returns: boolean
      }
      is_project_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
    }
    Enums: {
      member_role: 'owner' | 'admin' | 'member' | 'viewer'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
    }
    CompositeTypes: Record<string, never>
  }
}

// 테이블 Row 타입 헬퍼
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
