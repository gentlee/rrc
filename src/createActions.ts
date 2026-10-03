import type {EntityChanges, MutationState, QueryState, Typenames} from './types'
import {CacheState} from './types'
import {PACKAGE_SHORT_NAME} from './utilsAndConstants'

export type Actions<
  N extends string = string,
  T extends Typenames = Typenames,
  QP = unknown,
  QR = unknown,
  MP = unknown,
  MR = unknown,
> = ReturnType<typeof createActions<N, T, QP, QR, MP, MR>>

export const createActions = <N extends string, T extends Typenames, QP, QR, MP, MR>(name: N) => {
  const actionPrefix = `@${PACKAGE_SHORT_NAME}/${name}/` as const

  const updateQueryStateAndEntitiesType = `${actionPrefix}updateQueryStateAndEntities` as const
  const updateQueryStateAndEntities = <K extends keyof (QP | QR)>(
    queryKey: K,
    queryCacheKey: PropertyKey,
    state?: Partial<QueryState<T, QP[K], QR[K]>>,
    entityChanges?: EntityChanges<T>,
  ) => ({
    type: updateQueryStateAndEntitiesType,
    queryKey,
    queryCacheKey,
    state,
    entityChanges,
  })
  updateQueryStateAndEntities.type = updateQueryStateAndEntitiesType

  const updateMutationStateAndEntitiesType = `${actionPrefix}updateMutationStateAndEntities` as const
  const updateMutationStateAndEntities = <K extends keyof (MP | MR)>(
    mutationKey: K,
    state?: Partial<MutationState<T, MP[K], MR[K]>>,
    entityChanges?: EntityChanges<T>,
  ) => ({
    type: updateMutationStateAndEntitiesType,
    mutationKey,
    state,
    entityChanges,
  })
  updateMutationStateAndEntities.type = updateMutationStateAndEntitiesType

  const mergeEntityChangesType = `${actionPrefix}mergeEntityChanges` as const
  const mergeEntityChanges = (changes: EntityChanges<T>) => ({
    type: mergeEntityChangesType,
    changes,
  })
  mergeEntityChanges.type = mergeEntityChangesType

  const invalidateQueryType = `${actionPrefix}invalidateQuery` as const
  const invalidateQuery = <K extends keyof (QP | QR)>(
    queries: {
      /** Query key */
      query: K
      /** Query cache key */
      cacheKey?: PropertyKey
      /** Unix timestamp at which query expires. Is set to the query state. @Default Date.now() */
      expiresAt?: number
    }[],
  ) => ({
    type: invalidateQueryType,
    queries,
  })
  invalidateQuery.type = invalidateQueryType

  const clearQueryStateType = `${actionPrefix}clearQueryState` as const
  const clearQueryState = <K extends keyof (QP | QR)>(
    queries: {
      /** Query key */
      query: K
      /** Query cache key */
      cacheKey?: PropertyKey
    }[],
  ) => ({
    type: clearQueryStateType,
    queries,
  })
  clearQueryState.type = clearQueryStateType

  const clearMutationStateType = `${actionPrefix}clearMutationState` as const
  const clearMutationState = <K extends keyof (MP | MR)>(mutationKeys: K[]) => ({
    type: clearMutationStateType,
    mutationKeys,
  })
  clearMutationState.type = clearMutationStateType

  const clearCacheType = `${actionPrefix}clearCache` as const
  const clearCache = (stateToKeep?: Partial<CacheState<T, QP, QR, MP, MR>>) => ({
    type: clearCacheType,
    stateToKeep,
  })
  clearCache.type = clearCacheType

  return {
    updateQueryStateAndEntities,
    updateMutationStateAndEntities,
    mergeEntityChanges,
    invalidateQuery,
    clearQueryState,
    clearMutationState,
    clearCache,
  }
}
