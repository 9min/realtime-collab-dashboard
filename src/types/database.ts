// Supabase CLI로 자동 생성되는 파일
// 초기 세팅 단계에서는 placeholder로 유지
// 실제 타입은 `pnpm supabase:gen-types` 실행 후 교체

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
      automation_executions: {
        Row: {
          id: string
          rule_id: string
          project_id: string
          trigger_entity_id: string | null
          trigger_data: Json
          action_result: Json
          status: string
          error_message: string | null
          executed_at: string
        }
        Insert: {
          id?: string
          rule_id: string
          project_id: string
          trigger_entity_id?: string | null
          trigger_data?: Json
          action_result?: Json
          status?: string
          error_message?: string | null
          executed_at?: string
        }
        Update: {
          status?: string
          error_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'automation_executions_rule_id_fkey'
            columns: ['rule_id']
            isOneToOne: false
            referencedRelation: 'automation_rules'
            referencedColumns: ['id']
          },
        ]
      }
      automation_rules: {
        Row: {
          id: string
          project_id: string
          name: string
          trigger_type: string
          trigger_config: Json
          action_type: string
          action_config: Json
          is_active: boolean
          execution_count: number
          last_executed_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          trigger_type: string
          trigger_config?: Json
          action_type: string
          action_config?: Json
          is_active?: boolean
          execution_count?: number
          last_executed_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          trigger_type?: string
          trigger_config?: Json
          action_type?: string
          action_config?: Json
          is_active?: boolean
          execution_count?: number
          last_executed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'automation_rules_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'automation_rules_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          id: string
          project_id: string
          name: string
          field_type: 'text' | 'number' | 'select' | 'date' | 'checkbox'
          options: Json | null
          is_required: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          field_type: 'text' | 'number' | 'select' | 'date' | 'checkbox'
          options?: Json | null
          is_required?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          field_type?: 'text' | 'number' | 'select' | 'date' | 'checkbox'
          options?: Json | null
          is_required?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'custom_field_definitions_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
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
      kanban_columns: {
        Row: {
          id: string
          project_id: string
          title: string
          position: number
          wip_limit: number | null
          is_done_column: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          position: number
          wip_limit?: number | null
          is_done_column?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          position?: number
          wip_limit?: number | null
          is_done_column?: boolean
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
      kanban_filter_presets: {
        Row: {
          id: string
          project_id: string
          user_id: string
          filters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          filters?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kanban_filter_presets_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kanban_filter_presets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      labels: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: [
          {
            foreignKeyName: 'labels_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          project_id: string | null
          user_id: string
          actor_id: string | null
          type: string
          title: string
          message: string
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id: string
          actor_id?: string | null
          type: string
          title: string
          message: string
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_actor_id_fkey'
            columns: ['actor_id']
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
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      project_integrations: {
        Row: {
          id: string
          project_id: string
          type: string
          config: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: string
          config?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          config?: Json
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'project_integrations_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
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
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          feature_labels: boolean
          feature_subtasks: boolean
          feature_dependencies: boolean
          feature_attachments: boolean
          feature_comments: boolean
          feature_multi_assignees: boolean
          feature_templates: boolean
          feature_time_tracking: boolean
          feature_custom_fields: boolean
          feature_sprints: boolean
          feature_automations: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          feature_labels?: boolean
          feature_subtasks?: boolean
          feature_dependencies?: boolean
          feature_attachments?: boolean
          feature_comments?: boolean
          feature_multi_assignees?: boolean
          feature_templates?: boolean
          feature_time_tracking?: boolean
          feature_custom_fields?: boolean
          feature_sprints?: boolean
          feature_automations?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          feature_labels?: boolean
          feature_subtasks?: boolean
          feature_dependencies?: boolean
          feature_attachments?: boolean
          feature_comments?: boolean
          feature_multi_assignees?: boolean
          feature_templates?: boolean
          feature_time_tracking?: boolean
          feature_custom_fields?: boolean
          feature_sprints?: boolean
          feature_automations?: boolean
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
      sprints: {
        Row: {
          id: string
          project_id: string
          name: string
          goal: string | null
          start_date: string
          end_date: string
          status: 'planned' | 'active' | 'completed'
          created_by: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          goal?: string | null
          start_date: string
          end_date: string
          status?: 'planned' | 'active' | 'completed'
          created_by: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          goal?: string | null
          start_date?: string
          end_date?: string
          status?: 'planned' | 'active' | 'completed'
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sprints_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sprints_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      subtasks: {
        Row: {
          id: string
          task_id: string
          project_id: string
          title: string
          completed: boolean
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          title: string
          completed?: boolean
          position: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          completed?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subtasks_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subtasks_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subtasks_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_assignees: {
        Row: {
          id: string
          task_id: string
          user_id: string
          role: 'assignee' | 'watcher'
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          role?: 'assignee' | 'watcher'
          project_id?: string
          created_at?: string
        }
        Update: {
          role?: 'assignee' | 'watcher'
        }
        Relationships: [
          {
            foreignKeyName: 'task_assignees_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_assignees_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          project_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          content_type: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number
          content_type: string
          created_at?: string
        }
        Update: {
          file_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_attachments_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_attachments_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_attachments_user_id_fkey'
            columns: ['user_id']
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
          mentions: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          user_id: string
          content: string
          mentions?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          mentions?: string[] | null
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
      task_custom_field_values: {
        Row: {
          id: string
          task_id: string
          field_id: string
          value: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          field_id: string
          value?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          value?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_custom_field_values_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_custom_field_values_field_id_fkey'
            columns: ['field_id']
            isOneToOne: false
            referencedRelation: 'custom_field_definitions'
            referencedColumns: ['id']
          },
        ]
      }
      task_dependencies: {
        Row: {
          id: string
          project_id: string
          blocking_task_id: string
          blocked_task_id: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          blocking_task_id: string
          blocked_task_id: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          project_id?: string
          blocking_task_id?: string
          blocked_task_id?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'task_dependencies_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_dependencies_blocking_task_id_fkey'
            columns: ['blocking_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_dependencies_blocked_task_id_fkey'
            columns: ['blocked_task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_dependencies_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      task_labels: {
        Row: {
          task_id: string
          label_id: string
        }
        Insert: {
          task_id: string
          label_id: string
        }
        Update: Record<string, never>
        Relationships: [
          {
            foreignKeyName: 'task_labels_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_labels_label_id_fkey'
            columns: ['label_id']
            isOneToOne: false
            referencedRelation: 'labels'
            referencedColumns: ['id']
          },
        ]
      }
      task_templates: {
        Row: {
          id: string
          project_id: string
          created_by: string
          name: string
          description_template: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          subtasks_template: Json
          labels_template: Json
          is_personal: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          created_by: string
          name: string
          description_template?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          subtasks_template?: Json
          labels_template?: Json
          is_personal?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description_template?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          subtasks_template?: Json
          labels_template?: Json
          is_personal?: boolean
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'task_templates_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'task_templates_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
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
          sprint_id: string | null
          estimated_minutes: number | null
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
          sprint_id?: string | null
          estimated_minutes?: number | null
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
          sprint_id?: string | null
          estimated_minutes?: number | null
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
          {
            foreignKeyName: 'tasks_sprint_id_fkey'
            columns: ['sprint_id']
            isOneToOne: false
            referencedRelation: 'sprints'
            referencedColumns: ['id']
          },
        ]
      }
      time_entries: {
        Row: {
          id: string
          task_id: string
          project_id: string
          user_id: string
          duration_minutes: number
          description: string | null
          started_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          user_id: string
          duration_minutes: number
          description?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          duration_minutes?: number
          description?: string | null
          started_at?: string | null
          ended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'time_entries_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_project_id_fkey'
            columns: ['project_id']
            isOneToOne: false
            referencedRelation: 'projects'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_messages: {
        Row: {
          id: string
          user_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          message?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'user_messages_user_id_fkey'
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
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_project_member: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      get_all_project_memberships: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          project_id: string
          project_name: string
          role: Database['public']['Enums']['member_role']
          joined_at: string
        }[]
      }
      set_admin_status: {
        Args: { p_user_id: string; p_is_admin: boolean }
        Returns: undefined
      }
    }
    Enums: {
      member_role: 'owner' | 'admin' | 'member' | 'viewer'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      task_assignee_role: 'assignee' | 'watcher'
      custom_field_type: 'text' | 'number' | 'select' | 'date' | 'checkbox'
      sprint_status: 'planned' | 'active' | 'completed'
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
