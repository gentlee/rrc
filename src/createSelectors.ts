import {CacheState, MutationState, QueryState, Typenames} from './types'
import {EMPTY_OBJECT} from './utilsAndConstants'

export type Selectors<
  T extends Typenames = Typenames,
  QP = unknown,
  QR = unknown,
  MP = unknown,
  MR = unknown,
> = ReturnType<typeof createSelectors<T, QP, QR, MP, MR>>

export const createSelectors = <T extends Typenames, QP, QR, MP, MR>(
  selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR>,
) => {
  const selectEntityById = <TN extends keyof T>(
    state: unknown,
    id: PropertyKey | null | undefined,
    typename: TN,
  ): T[TN] | undefined => {
    // @ts-expect-error fix later
    return id == null ? undefined : selectCacheState(state).entities[typename]?.[id]
  }

  const selectQueryState = <QK extends keyof (QP & QR)>(
    state: unknown,
    query: QK,
    cacheKey: PropertyKey,
  ): QueryState<
    T,
    QK extends keyof (QP | QR) ? QP[QK] : never,
    QK extends keyof (QP | QR) ? QR[QK] : never
  > => {
    return selectCacheState(state).queries[query][cacheKey] ?? EMPTY_OBJECT
  }

  const selectMutationState = <MK extends keyof (MP & MR)>(
    state: unknown,
    mutation: MK,
  ): MutationState<
    T,
    MK extends keyof (MP | MR) ? MP[MK] : never,
    MK extends keyof (MP | MR) ? MR[MK] : never
  > => {
    // @ts-expect-error fix later
    return selectCacheState(state).mutations[mutation] ?? EMPTY_OBJECT
  }

  return {
    selectCacheState,
    selectEntityById,
    selectQueryState,
    selectQueryResult: <QK extends keyof (QP & QR)>(state: unknown, query: QK, cacheKey: PropertyKey) => {
      return selectQueryState(state, query, cacheKey).result
    },
    selectQueryLoading: <QK extends keyof (QP & QR)>(state: unknown, query: QK, cacheKey: PropertyKey) => {
      return selectQueryState(state, query, cacheKey).loading ?? false
    },
    selectQueryError: <QK extends keyof (QP & QR)>(state: unknown, query: QK, cacheKey: PropertyKey) => {
      return selectQueryState(state, query, cacheKey).error
    },
    selectQueryParams: <QK extends keyof (QP & QR)>(state: unknown, query: QK, cacheKey: PropertyKey) => {
      return selectQueryState(state, query, cacheKey).params
    },
    selectQueryExpiresAt: <QK extends keyof (QP & QR)>(state: unknown, query: QK, cacheKey: PropertyKey) => {
      return selectQueryState(state, query, cacheKey).expiresAt
    },
    selectMutationState,
    selectMutationResult: <MK extends keyof (MP & MR)>(state: unknown, mutation: MK) => {
      return selectMutationState(state, mutation).result
    },
    selectMutationLoading: <MK extends keyof (MP & MR)>(state: unknown, mutation: MK) => {
      return selectMutationState(state, mutation).loading ?? false
    },
    selectMutationError: <MK extends keyof (MP & MR)>(state: unknown, mutation: MK) => {
      return selectMutationState(state, mutation).error
    },
    selectMutationParams: <MK extends keyof (MP & MR)>(state: unknown, mutation: MK) => {
      return selectMutationState(state, mutation).params
    },
    selectEntities: (state: unknown) => {
      return selectCacheState(state).entities
    },
    selectEntitiesByTypename: <TN extends keyof T>(state: unknown, typename: TN) => {
      return selectCacheState(state).entities[typename]
    },
  }
}
