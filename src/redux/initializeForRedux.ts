/* eslint-disable @typescript-eslint/no-unused-vars */

import {bindAsyncActions} from '../bindAsyncActions'
import {mutate as mutateImpl} from '../mutate'
import {query as queryImpl} from '../query'
import type {
  AnyStore,
  Cache,
  CacheClient,
  CacheConfig,
  CacheOptions,
  CacheState,
  Dict,
  EntitiesMap,
  EntityChanges,
  EntityIds,
  Globals,
  Mutable,
  MutateOptions,
  Mutation,
  MutationInfo,
  MutationResponse,
  MutationResult,
  MutationState,
  NormalizedMutation,
  NormalizedMutationResponse,
  NormalizedQuery,
  NormalizedQueryResponse,
  OptionalPartial,
  PartialEntitiesMap,
  Query,
  QueryInfo,
  QueryOptions,
  QueryResponse,
  QueryResult,
  QueryState,
  QueryStateComparer,
  ReduxStoreLike,
  Typenames,
  UseQueryOptions,
  UseSelector,
  ZustandStoreLike,
} from '../types'
import {CacheExtensions, CachePrivate, CacheToPrivate, InnerStore, StoreHooksPrivate} from '../typesPrivate'
import {defaultGetCacheKey} from '../utilsAndConstants'

/** Initializes cache for Redux, returning reducer, actions, async actions and utils. */
export const initializeForRedux = <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR>(
  cache: Cache<N, SK, T, QP, QR, MP, MR>,
) => {
  const privateCache = cache as CachePrivate<N, SK, T, QP, QR, MP, MR>

  const {
    config: {queries},
    actions: {
      clearCache,
      clearMutationState,
      clearQueryState,
      invalidateQuery,
      mergeEntityChanges,
      updateMutationStateAndEntities,
      updateQueryStateAndEntities,
    },
  } = privateCache

  const result = {
    // doc-ignore
    /** Reducer of the cache, should be added to Redux store. */
    reducer: privateCache.reducer,
    // doc-header
    actions: {
      /** Updates query state, and optionally merges entity changes in a single action. */
      updateQueryStateAndEntities,
      /** Updates mutation state, and optionally merges entity changes in a single action. */
      updateMutationStateAndEntities,
      /** Merges EntityChanges to the state. */
      mergeEntityChanges,
      /** Sets expiresAt to Date.now(). */
      invalidateQuery,
      /** Clears states for provided query keys and cache keys.
       * If cache key for query key is not provided, the whole state for query key is cleared. */
      clearQueryState,
      /** Clears states for provided mutation keys. */
      clearMutationState,
      /** Replaces cache state with initial, optionally merging with provided state. Doesn't cancel running fetches and should be used with caution. */
      clearCache,
    },
    // doc-header
    /**
     * Asynchronous logic. No `redux-thunk` needed - just pass the store from `useStore`.
     * Also consider using `bindAsyncActions` util or `useClient` from React initialization. */
    asyncActions: {
      /**
       * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
       * @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.
       * @param skipFetch Fetch is cancelled and current cached result is returned.
       */
      query: <QK extends keyof (QP & QR)>(store: ReduxStoreLike, options: QueryOptions<T, QP, QR, QK>) => {
        type P = QK extends keyof (QP | QR) ? QP[QK] : never
        type R = QK extends keyof (QP | QR) ? QR[QK] : never

        const {query: queryKey, params} = options
        const getCacheKey = queries[queryKey].getCacheKey ?? defaultGetCacheKey<P>
        // @ts-expect-error fix later
        const cacheKey = getCacheKey(params)

        return queryImpl(
          'asyncActions.query',
          store,
          store,
          privateCache,
          queryKey,
          cacheKey,
          params,
          options.onlyIfExpired,
          options.skipFetch,
          options.secondsToLive,
          // @ts-expect-error fix later
          options.mergeResults,
          options.onCompleted,
          options.onSuccess,
          options.onError,
        ) as Promise<QueryResult<R>>
      },
      /**
       * Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished succesfully.
       */
      mutate: <MK extends keyof (MP & MR)>(store: ReduxStoreLike, options: MutateOptions<T, MP, MR, MK>) => {
        type R = MK extends keyof (MP | MR) ? MR[MK] : never

        return mutateImpl(
          'asyncActions.mutate',
          store,
          store,
          privateCache,
          options.mutation,
          options.params,
          // @ts-expect-error fix later
          options.onCompleted,
          options.onSuccess,
          options.onError,
        ) as Promise<MutationResult<R>>
      },
    },
    // doc-header
    utils: {
      /** Binds async actions to the store. Can be used when the store is a singleton for direct import. */
      bindAsyncActions: (store: ReduxStoreLike) => bindAsyncActions(privateCache, store, store),
    },
  }

  return result
}
