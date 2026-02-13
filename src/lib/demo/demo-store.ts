import { createInitialDemoData } from './demo-data'

type Row = Record<string, unknown>

/**
 * 인메모리 데이터 저장소
 *
 * 모듈 레벨 싱글턴 — 새로고침 시 자동 리셋
 */
class DemoDataStore {
  private tables: Map<string, Row[]>

  constructor() {
    this.tables = createInitialDemoData()
  }

  getTable(name: string): Row[] {
    if (!this.tables.has(name)) {
      this.tables.set(name, [])
    }
    return this.tables.get(name)!
  }

  insertRow(table: string, row: Row): Row {
    const rows = this.getTable(table)
    // ID 자동 생성 (insert 시 id가 없으면)
    if (!row['id'] && table !== 'task_labels') {
      row['id'] = `demo-${table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    // created_at 자동 설정
    if (!row['created_at']) {
      row['created_at'] = new Date().toISOString()
    }
    // updated_at 자동 설정
    if ('updated_at' in this.getSchemaFields(table)) {
      row['updated_at'] = new Date().toISOString()
    }
    rows.push(row)
    return row
  }

  insertRows(table: string, rowsToInsert: Row[]): Row[] {
    return rowsToInsert.map((row) => this.insertRow(table, row))
  }

  updateRows(table: string, filters: [string, string, unknown][], data: Row): Row[] {
    const rows = this.getTable(table)
    const updated: Row[] = []

    for (const row of rows) {
      if (this.matchesFilters(row, filters)) {
        Object.assign(row, data)
        if (row['updated_at'] !== undefined) {
          row['updated_at'] = new Date().toISOString()
        }
        updated.push(row)
      }
    }

    return updated
  }

  upsertRows(table: string, rowsToUpsert: Row[], conflictColumns: string[] = ['id']): Row[] {
    const result: Row[] = []
    for (const row of rowsToUpsert) {
      const filters: [string, string, unknown][] = conflictColumns.map((col) => [
        col,
        'eq',
        row[col],
      ])
      const existing = this.getTable(table).filter((r) => this.matchesFilters(r, filters))

      if (existing.length > 0) {
        const updated = this.updateRows(table, filters, row)
        result.push(...updated)
      } else {
        result.push(this.insertRow(table, row))
      }
    }
    return result
  }

  deleteRows(table: string, filters: [string, string, unknown][]): Row[] {
    const rows = this.getTable(table)
    const deleted: Row[] = []
    const remaining: Row[] = []

    for (const row of rows) {
      if (this.matchesFilters(row, filters)) {
        deleted.push(row)
      } else {
        remaining.push(row)
      }
    }

    this.tables.set(table, remaining)
    return deleted
  }

  matchesFilters(row: Row, filters: [string, string, unknown][]): boolean {
    return filters.every(([col, op, val]) => {
      const rowVal = row[col]
      switch (op) {
        case 'eq':
          return rowVal === val
        case 'neq':
          return rowVal !== val
        case 'lt':
          return typeof rowVal === 'string' && typeof val === 'string'
            ? rowVal < val
            : Number(rowVal) < Number(val)
        case 'gt':
          return typeof rowVal === 'string' && typeof val === 'string'
            ? rowVal > val
            : Number(rowVal) > Number(val)
        case 'lte':
          return typeof rowVal === 'string' && typeof val === 'string'
            ? rowVal <= val
            : Number(rowVal) <= Number(val)
        case 'gte':
          return typeof rowVal === 'string' && typeof val === 'string'
            ? rowVal >= val
            : Number(rowVal) >= Number(val)
        case 'in':
          return Array.isArray(val) && val.includes(rowVal)
        case 'ilike': {
          if (typeof rowVal !== 'string' || typeof val !== 'string') return false
          const pattern = val.replace(/%/g, '.*').replace(/_/g, '.')
          return new RegExp(pattern, 'i').test(rowVal)
        }
        case 'not.in':
          return Array.isArray(val) && !val.includes(rowVal)
        case 'not.is':
          return rowVal !== val
        case 'is':
          return rowVal === val
        default:
          return true
      }
    })
  }

  // FK 관계 기반 조인 매핑
  getRelationConfig(
    table: string,
    relationName: string,
  ): { table: string; fkColumn: string; type: 'object' | 'array' } | null {
    const relations: Record<
      string,
      Record<string, { table: string; fkColumn: string; type: 'object' | 'array' }>
    > = {
      project_members: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      tasks: {
        profiles: { table: 'profiles', fkColumn: 'assignee_id', type: 'object' },
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
        kanban_columns: { table: 'kanban_columns', fkColumn: 'column_id', type: 'object' },
      },
      task_comments: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
      },
      task_attachments: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      activity_logs: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      notifications: {
        actor: { table: 'profiles', fkColumn: 'actor_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      subtasks: {
        profiles: { table: 'profiles', fkColumn: 'created_by', type: 'object' },
      },
      task_labels: {
        labels: { table: 'labels', fkColumn: 'label_id', type: 'object' },
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
      },
      task_dependencies: {
        blocking_task: { table: 'tasks', fkColumn: 'blocking_task_id', type: 'object' },
        blocked_task: { table: 'tasks', fkColumn: 'blocked_task_id', type: 'object' },
      },
      task_favorites: {
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      task_recurrences: {
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'created_by', type: 'object' },
      },
      kanban_filter_presets: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
      },
      task_assignees: {
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
      },
      custom_field_definitions: {
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
      },
      task_custom_field_values: {
        custom_field_definitions: {
          table: 'custom_field_definitions',
          fkColumn: 'field_id',
          type: 'object',
        },
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
      },
      sprints: {
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'created_by', type: 'object' },
      },
      automation_rules: {
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'created_by', type: 'object' },
      },
      automation_executions: {
        automation_rules: { table: 'automation_rules', fkColumn: 'rule_id', type: 'object' },
      },
      time_entries: {
        tasks: { table: 'tasks', fkColumn: 'task_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'user_id', type: 'object' },
      },
      task_templates: {
        projects: { table: 'projects', fkColumn: 'project_id', type: 'object' },
        profiles: { table: 'profiles', fkColumn: 'created_by', type: 'object' },
      },
    }
    return relations[table]?.[relationName] ?? null
  }

  private getSchemaFields(table: string): Record<string, boolean> {
    const tablesWithUpdatedAt = [
      'profiles',
      'projects',
      'kanban_columns',
      'tasks',
      'subtasks',
      'task_comments',
      'dashboard_layouts',
      'project_integrations',
      'task_recurrences',
      'kanban_filter_presets',
      'task_assignees',
      'custom_field_definitions',
      'task_custom_field_values',
      'sprints',
      'automation_rules',
      'automation_executions',
      'time_entries',
      'task_templates',
    ]
    if (tablesWithUpdatedAt.includes(table)) {
      return { updated_at: true }
    }
    return {}
  }
}

// 모듈 레벨 싱글턴
export const demoDataStore = new DemoDataStore()
