import { vi } from 'vitest'

/**
 * Supabase PostgREST query builder mock.
 * 모든 체이닝 메서드가 builder 자신을 반환하고,
 * await 시 지정된 response로 resolve 된다.
 */
function createQueryBuilder(response: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}

  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'or',
    'ilike',
    'like',
    'order',
    'limit',
    'range',
    'returns',
    'single',
    'maybeSingle',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  // thenable — await 시 response 반환
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
    Promise.resolve(response).then(resolve, reject)

  return builder
}

interface MockStorageOptions {
  uploadResponse?: { data: unknown; error: unknown }
  removeResponse?: { data: unknown; error: unknown }
  publicUrl?: string
}

interface MockClientOptions {
  /** from() 호출 순서대로 반환할 응답 배열 */
  fromResponses?: Array<{ data: unknown; error: unknown }>
  /** rpc() 호출 응답 */
  rpcResponse?: { data: unknown; error: unknown }
  /** auth.getUser() 응답 유저 (null이면 미인증) */
  authUser?: { id: string; email?: string } | null
  /** auth.updateUser() 응답 */
  updateUserResponse?: { data: unknown; error: unknown }
  /** storage mock 설정 */
  storage?: MockStorageOptions
}

/**
 * 테스트용 Supabase client mock 생성.
 * DI 패턴으로 서비스에 주입하여 사용.
 */
export function createMockSupabaseClient(options: MockClientOptions = {}) {
  const {
    fromResponses = [],
    rpcResponse,
    authUser,
    updateUserResponse,
    storage: storageOptions,
  } = options

  let fromCallIndex = 0
  const builders: ReturnType<typeof createQueryBuilder>[] = []

  const from = vi.fn().mockImplementation(() => {
    const response = fromResponses[fromCallIndex] ?? { data: null, error: null }
    const builder = createQueryBuilder(response)
    builders.push(builder)
    fromCallIndex++
    return builder
  })

  const rpc = vi.fn().mockResolvedValue(rpcResponse ?? { data: null, error: null })

  const auth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: authUser !== undefined ? authUser : null },
      error: null,
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: '' }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi
      .fn()
      .mockResolvedValue(updateUserResponse ?? { data: { user: authUser }, error: null }),
  }

  const storageBucket = {
    upload: vi
      .fn()
      .mockResolvedValue(
        storageOptions?.uploadResponse ?? { data: { path: 'test/avatar.png' }, error: null },
      ),
    remove: vi
      .fn()
      .mockResolvedValue(storageOptions?.removeResponse ?? { data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: {
        publicUrl:
          storageOptions?.publicUrl ??
          'https://example.com/storage/v1/object/public/avatars/test/avatar.png',
      },
    }),
  }

  const storage = {
    from: vi.fn().mockReturnValue(storageBucket),
    _bucket: storageBucket,
  }

  return {
    from,
    rpc,
    auth,
    storage,
    /** 내부 테스트용: from() 호출마다 생성된 query builder 목록 */
    _builders: builders,
  } as unknown
}
