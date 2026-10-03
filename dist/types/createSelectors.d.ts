import {CacheState, MutationState, QueryState, Typenames} from './types'

export type Selectors<
  T extends Typenames = Typenames,
  QP = unknown,
  QR = unknown,
  MP = unknown,
  MR = unknown,
> = ReturnType<typeof createSelectors<T, QP, QR, MP, MR>>

export declare const createSelectors: <T extends Typenames, QP, QR, MP, MR>(
  selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR>,
) => {
  selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR>
  selectEntityById: <TN extends keyof T>(
    state: unknown,
    id: PropertyKey | null | undefined,
    typename: TN,
  ) => T[TN] | undefined
  selectQueryState: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) => QueryState<T, QK extends keyof (QP | QR) ? QP[QK] : never, QK extends keyof (QP | QR) ? QR[QK] : never>
  selectQueryResult: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) => (QK extends keyof QP & keyof QR ? QR[QK] : never) | undefined
  selectQueryLoading: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) =>
    | false
    | Promise<import('./types').NormalizedQueryResponse<T, QK extends keyof QP & keyof QR ? QR[QK] : never>>
  selectQueryError: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) => Error | undefined
  selectQueryParams: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) => (QK extends keyof QP & keyof QR ? QP[QK] : never) | undefined
  selectQueryExpiresAt: <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ) => number | undefined
  selectMutationState: <MK extends keyof (MP & MR)>(
    state: unknown,
    mutation: MK,
  ) => MutationState<
    T,
    MK extends keyof (MP | MR) ? MP[MK] : never,
    MK extends keyof (MP | MR) ? MR[MK] : never
  >
  selectMutationResult: <MK extends keyof (MP & MR)>(
    state: unknown,
    mutation: MK,
  ) => (MK extends keyof MP & keyof MR ? MR[MK] : never) | undefined
  selectMutationLoading: <MK extends keyof (MP & MR)>(
    state: unknown,
    mutation: MK,
  ) =>
    | false
    | Promise<import('./types').NormalizedQueryResponse<T, MK extends keyof MP & keyof MR ? MR[MK] : never>>
  selectMutationError: <MK extends keyof (MP & MR)>(state: unknown, mutation: MK) => Error | undefined
  selectMutationParams: <MK extends keyof (MP & MR)>(
    state: unknown,
    mutation: MK,
  ) => (MK extends keyof MP & keyof MR ? MP[MK] : never) | undefined
  selectEntities: (state: unknown) => import('./types').EntitiesMap<T> & import('./types').Mutable
  selectEntitiesByTypename: <TN extends keyof T>(
    state: unknown,
    typename: TN,
  ) => (import('./types').EntitiesMap<T> & import('./types').Mutable)[TN]
}
