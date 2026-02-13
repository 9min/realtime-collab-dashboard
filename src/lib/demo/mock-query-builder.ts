import { demoDataStore } from './demo-store'

type Row = Record<string, unknown>
type PostgrestResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { code: string; message: string; details: string; hint: string } }

/**
 * PostgREST 쿼리 빌더 Mock
 *
 * Supabase client의 `.from(table).select().eq()...` 체이닝 패턴을 구현
 * thenable로 `await` 시 자동 실행
 */
export class MockQueryBuilder {
  private tableName: string
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private selectColumns = '*'
  private filters: [string, string, unknown][] = []
  private orFilters: string[] = []
  private orderClauses: { column: string; ascending: boolean }[] = []
  private limitCount: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private isSingle = false
  private isMaybeSingle = false
  private insertData: Row | Row[] | null = null
  private updateData: Row | null = null
  private mutationSelectColumns: string | null = null
  private countOption: 'exact' | null = null
  private headOption = false
  private upsertConflictColumns: string[] = ['id']

  constructor(tableName: string) {
    this.tableName = tableName
  }

  select(columns?: string, options?: { count?: 'exact'; head?: boolean }): this {
    if (
      this.operation !== 'select' &&
      (this.operation === 'insert' ||
        this.operation === 'update' ||
        this.operation === 'delete' ||
        this.operation === 'upsert')
    ) {
      // mutation 후 .select() 호출: mutation 결과에서 컬럼 선택
      this.mutationSelectColumns = columns ?? '*'
      this.selectColumns = columns ?? '*'
    } else {
      this.operation = 'select'
      this.selectColumns = columns ?? '*'
    }
    if (options?.count) {
      this.countOption = options.count
    }
    if (options?.head) {
      this.headOption = true
    }
    return this
  }

  insert(data: Row | Row[]): this {
    this.operation = 'insert'
    this.insertData = data
    return this
  }

  update(data: Row): this {
    this.operation = 'update'
    this.updateData = data
    return this
  }

  delete(): this {
    this.operation = 'delete'
    return this
  }

  upsert(data: Row | Row[], options?: { onConflict?: string }): this {
    this.operation = 'upsert'
    this.insertData = data
    if (options?.onConflict) {
      this.upsertConflictColumns = options.onConflict.split(',').map((c) => c.trim())
    }
    return this
  }

  // 필터 메서드
  eq(column: string, value: unknown): this {
    this.filters.push([column, 'eq', value])
    return this
  }

  neq(column: string, value: unknown): this {
    this.filters.push([column, 'neq', value])
    return this
  }

  lt(column: string, value: unknown): this {
    this.filters.push([column, 'lt', value])
    return this
  }

  gt(column: string, value: unknown): this {
    this.filters.push([column, 'gt', value])
    return this
  }

  lte(column: string, value: unknown): this {
    this.filters.push([column, 'lte', value])
    return this
  }

  gte(column: string, value: unknown): this {
    this.filters.push([column, 'gte', value])
    return this
  }

  in(column: string, values: unknown[]): this {
    this.filters.push([column, 'in', values])
    return this
  }

  not(column: string, operator: string, value: unknown): this {
    if (operator === 'in') {
      const parsed = typeof value === 'string' ? value.replace(/^\(|\)$/g, '').split(',') : value
      this.filters.push([column, 'not.in', parsed])
    } else if (operator === 'is') {
      this.filters.push([column, 'not.is', value])
    } else {
      this.filters.push([column, `not.${operator}`, value])
    }
    return this
  }

  is(column: string, value: null | boolean): this {
    this.filters.push([column, 'is', value])
    return this
  }

  ilike(column: string, pattern: string): this {
    this.filters.push([column, 'ilike', pattern])
    return this
  }

  or(filterStr: string): this {
    this.orFilters.push(filterStr)
    return this
  }

  // 정렬/제한
  order(column: string, options?: { ascending?: boolean }): this {
    this.orderClauses.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  limit(count: number): this {
    this.limitCount = count
    return this
  }

  range(from: number, to: number): this {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  // 결과 형태
  single(): this {
    this.isSingle = true
    return this
  }

  maybeSingle(): this {
    this.isMaybeSingle = true
    return this
  }

  returns<T>(): MockQueryBuilder & PromiseLike<PostgrestResponse<T>> {
    return this as unknown as MockQueryBuilder & PromiseLike<PostgrestResponse<T>>
  }

  // thenable — await 시 자동 실행
  then<TResult1 = PostgrestResponse<unknown>, TResult2 = never>(
    onfulfilled?: ((value: PostgrestResponse<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const result = this.execute()
    return Promise.resolve(result).then(onfulfilled, onrejected)
  }

  private execute(): PostgrestResponse<unknown> {
    switch (this.operation) {
      case 'select':
        return this.executeSelect()
      case 'insert':
        return this.executeInsert()
      case 'update':
        return this.executeUpdate()
      case 'delete':
        return this.executeDelete()
      case 'upsert':
        return this.executeUpsert()
      default:
        return {
          data: null,
          error: { code: 'UNKNOWN', message: 'Unknown operation', details: '', hint: '' },
        }
    }
  }

  private executeSelect(): PostgrestResponse<unknown> {
    let rows = [...demoDataStore.getTable(this.tableName)]

    // dot-notation 필터 분리 (e.g., 'labels.project_id') — join 후 적용
    const directFilters: [string, string, unknown][] = []
    const joinedFilters: { relation: string; column: string; op: string; value: unknown }[] = []
    for (const [col, op, val] of this.filters) {
      const dotIdx = col.indexOf('.')
      if (dotIdx !== -1) {
        joinedFilters.push({
          relation: col.slice(0, dotIdx),
          column: col.slice(dotIdx + 1),
          op,
          value: val,
        })
      } else {
        directFilters.push([col, op, val])
      }
    }

    // 직접 필터 적용
    rows = rows.filter((row) => demoDataStore.matchesFilters(row, directFilters))

    // or 필터 적용
    if (this.orFilters.length > 0) {
      rows = rows.filter((row) => {
        return this.orFilters.every((orStr) => {
          const conditions = orStr.split(',')
          return conditions.some((cond) => this.evaluateOrCondition(row, cond.trim()))
        })
      })
    }

    // 관계(join) 처리
    rows = this.applyJoins(rows)

    // join된 테이블 컬럼 필터 적용 (e.g., .eq('labels.project_id', projectId))
    if (joinedFilters.length > 0) {
      rows = rows.filter((row) => {
        return joinedFilters.every(({ relation, column, op, value }) => {
          const joined = row[relation]
          if (joined == null) return false
          if (typeof joined === 'object' && !Array.isArray(joined)) {
            return demoDataStore.matchesFilters(joined as Row, [[column, op, value]])
          }
          return false
        })
      })
    }

    // 정렬
    if (this.orderClauses.length > 0) {
      rows.sort((a, b) => {
        for (const { column, ascending } of this.orderClauses) {
          const aVal = a[column]
          const bVal = b[column]
          if (aVal === bVal) continue
          if (aVal == null) return ascending ? -1 : 1
          if (bVal == null) return ascending ? 1 : -1

          const cmp =
            typeof aVal === 'number' && typeof bVal === 'number'
              ? aVal - bVal
              : String(aVal).localeCompare(String(bVal))

          return ascending ? cmp : -cmp
        }
        return 0
      })
    }

    // count는 페이지네이션 적용 전 전체 필터링된 행 수
    const totalCount = rows.length

    // head: true → 데이터 없이 count만 반환
    if (this.headOption) {
      return { data: null, count: totalCount, error: null } as unknown as PostgrestResponse<unknown>
    }

    // 범위/제한
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1)
    }
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount)
    }

    // 컬럼 필터링
    rows = this.applyColumnSelection(rows)

    if (this.isSingle) {
      if (rows.length === 0) {
        return {
          data: null,
          error: {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: '',
            hint: '',
          },
        }
      }
      const result = this.countOption
        ? { data: rows[0], count: totalCount, error: null }
        : { data: rows[0], error: null }
      return result as PostgrestResponse<unknown>
    }

    if (this.isMaybeSingle) {
      const result = this.countOption
        ? { data: rows[0] ?? null, count: totalCount, error: null }
        : { data: rows[0] ?? null, error: null }
      return result as PostgrestResponse<unknown>
    }

    const result = this.countOption
      ? { data: rows, count: totalCount, error: null }
      : { data: rows, error: null }
    return result as PostgrestResponse<unknown>
  }

  private executeInsert(): PostgrestResponse<unknown> {
    const dataArr = Array.isArray(this.insertData) ? this.insertData : [this.insertData!]
    const inserted = demoDataStore.insertRows(
      this.tableName,
      dataArr.map((d) => ({ ...d })),
    )

    if (this.mutationSelectColumns) {
      const result = this.applyColumnSelection(this.applyJoins(inserted))
      if (this.isSingle) return { data: result[0] ?? null, error: null }
      return { data: result, error: null }
    }

    if (this.isSingle) return { data: inserted[0] ?? null, error: null }
    return { data: inserted, error: null }
  }

  private executeUpdate(): PostgrestResponse<unknown> {
    const updated = demoDataStore.updateRows(this.tableName, this.filters, { ...this.updateData! })

    if (this.mutationSelectColumns) {
      const result = this.applyColumnSelection(this.applyJoins(updated))
      if (this.isSingle) return { data: result[0] ?? null, error: null }
      return { data: result, error: null }
    }

    if (this.isSingle) return { data: updated[0] ?? null, error: null }
    return { data: updated, error: null }
  }

  private executeDelete(): PostgrestResponse<unknown> {
    const deleted = demoDataStore.deleteRows(this.tableName, this.filters)

    if (this.mutationSelectColumns) {
      const result = this.applyColumnSelection(deleted)
      if (this.isSingle) return { data: result[0] ?? null, error: null }
      return { data: result, error: null }
    }

    return { data: deleted, error: null }
  }

  private executeUpsert(): PostgrestResponse<unknown> {
    const dataArr = Array.isArray(this.insertData) ? this.insertData : [this.insertData!]
    const upserted = demoDataStore.upsertRows(
      this.tableName,
      dataArr.map((d) => ({ ...d })),
      this.upsertConflictColumns,
    )

    if (this.mutationSelectColumns) {
      const result = this.applyColumnSelection(this.applyJoins(upserted))
      if (this.isSingle) return { data: result[0] ?? null, error: null }
      return { data: result, error: null }
    }

    if (this.isSingle) return { data: upserted[0] ?? null, error: null }
    return { data: upserted, error: null }
  }

  /**
   * 관계(join) 처리
   *
   * 지원 패턴:
   *   - `profiles(*)`                              → 테이블명 = 별칭
   *   - `actor:profiles!notifications_actor_id_fkey(*)` → 별칭:테이블!FK명(*)
   *   - `labels!inner(project_id)`                 → inner join + 컬럼 선택
   *   - `projects(name)`                           → 특정 컬럼만 선택
   */
  private applyJoins(rows: Row[]): Row[] {
    // 다양한 조인 패턴 파싱
    // 패턴1: alias:table!fk_name(columns)  예: actor:profiles!notifications_actor_id_fkey(*)
    // 패턴2: table!inner(columns)          예: labels!inner(project_id)
    // 패턴3: table(columns)                예: profiles(*), projects(name)
    const joinRegex = /(?:(\w+):)?(\w+)(?:!(\w+))?\(([^)]*)\)/g
    let match: RegExpExecArray | null
    const joins: {
      alias: string
      relationName: string
      fkHint: string | null
      innerJoin: boolean
      columns: string
    }[] = []

    while ((match = joinRegex.exec(this.selectColumns)) !== null) {
      const aliasOrNull = match[1] ?? null // "actor" or null
      const tableName = match[2] // "profiles", "labels", "projects"
      const modifier = match[3] ?? null // FK name, "inner", or null
      const columns = match[4] // "*", "project_id", "name"

      const isInner = modifier === 'inner'
      const fkHint = modifier && !isInner ? modifier : null
      const alias = aliasOrNull ?? tableName

      joins.push({ alias, relationName: alias, fkHint, innerJoin: isInner, columns })
    }

    if (joins.length === 0) return rows

    return rows
      .map((row) => {
        const newRow = { ...row }
        for (const join of joins) {
          const config = demoDataStore.getRelationConfig(this.tableName, join.alias)
          if (config) {
            const relatedTable = demoDataStore.getTable(config.table)
            const fkValue = row[config.fkColumn]

            if (config.type === 'object') {
              const found = relatedTable.find((r) => r['id'] === fkValue) ?? null
              // 특정 컬럼만 선택 (e.g., projects(name))
              if (found && join.columns !== '*') {
                const cols = join.columns.split(',').map((c) => c.trim())
                const filtered: Row = {}
                for (const col of cols) {
                  if (col in found) filtered[col] = found[col]
                }
                newRow[join.alias] = filtered
              } else {
                newRow[join.alias] = found
              }
            } else {
              newRow[join.alias] = relatedTable.filter((r) => r['id'] === fkValue)
            }
          }
        }
        return newRow
      })
      .filter((row) => {
        // inner join: 관련 데이터가 없으면 해당 row 제외
        for (const join of joins) {
          if (join.innerJoin && !row[join.alias]) return false
        }
        return true
      })
  }

  // 컬럼 필터링
  private applyColumnSelection(rows: Row[]): Row[] {
    const cols = this.mutationSelectColumns ?? this.selectColumns
    if (cols === '*' || cols.includes('*')) return rows

    // 단순 컬럼 + 관계 컬럼 분리
    const parts = cols.split(',').map((p) => p.trim())
    const simpleColumns: string[] = []
    const relationAliases: string[] = []

    for (const part of parts) {
      if (part.includes('(') || part.includes(':')) {
        // 조인 관계 컬럼: "profiles(*)" or "actor:profiles!fk(*)"
        const aliasMatch = part.match(/^(?:(\w+):)?(\w+)/)
        if (aliasMatch) {
          relationAliases.push(aliasMatch[1] ?? aliasMatch[2])
        }
      } else {
        simpleColumns.push(part)
      }
    }

    if (simpleColumns.length === 0 && relationAliases.length === 0) return rows

    return rows.map((row) => {
      const newRow: Row = {}
      for (const col of simpleColumns) {
        if (col in row) newRow[col] = row[col]
      }
      for (const alias of relationAliases) {
        if (alias in row) newRow[alias] = row[alias]
      }
      if (Object.keys(newRow).length === 0) return row
      return newRow
    })
  }

  // or 필터 조건 평가
  private evaluateOrCondition(row: Row, condition: string): boolean {
    const dotIndex = condition.indexOf('.')
    if (dotIndex === -1) return true

    const column = condition.slice(0, dotIndex)
    const rest = condition.slice(dotIndex + 1)
    const opIndex = rest.indexOf('.')
    if (opIndex === -1) return true

    const op = rest.slice(0, opIndex)
    const value = rest.slice(opIndex + 1)

    return demoDataStore.matchesFilters(row, [[column, op, value]])
  }
}

export function createMockQueryBuilder(tableName: string): MockQueryBuilder {
  return new MockQueryBuilder(tableName)
}
