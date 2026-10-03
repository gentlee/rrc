/* eslint-disable @typescript-eslint/no-unused-vars */

import {bindAsyncActions} from '../bindAsyncActions'
import {Actions} from '../createActions'
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
import {defaultGetCacheKey, logDebug, logWarn} from '../utilsAndConstants'

/** Initializes cache for Zustand, returning actions. */
export const initializeForZustand = <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  S = unknown,
>(
  cache: Cache<N, SK, T, QP, QR, MP, MR>,
  store: ZustandStoreLike<S>,
) => {
  type TypedActions = Actions<N, T, QP, QR, MP, MR>

  const privateCache = cache as CachePrivate<N, SK, T, QP, QR, MP, MR>
  const {
    config: {
      options: {logsEnabled},
      queries,
    },
    reducer,
    actions,
    selectors: {selectCacheState},
    utils: {getRootState},
  } = privateCache

  const dispatch = (action: Actions<N, T, QP, QR, MP, MR>[keyof Actions]) => {
    const state = reducer(
      selectCacheState(store.getState()),
      // @ts-expect-error TODO fix types
      action,
    )
    store.setState(getRootState(state) as S)
  }

  const innerStore = {dispatch, getState: store.getState}
  privateCache.extensions ??= {}
  if (privateCache.extensions.zustand !== undefined) {
    logWarn('initializeForZustand', 'Already initialized for Zustand')
  }
  privateCache.extensions.zustand ??= {} as NonNullable<CacheExtensions['zustand']>
  privateCache.extensions.zustand.innerStore = innerStore
  privateCache.extensions.zustand.externalStore = store
  logsEnabled && logDebug('initializeForZustand', 'Initialized for Zustand')

  // Bind actions to dispatch

  const {
    clearCache,
    clearMutationState,
    clearQueryState,
    invalidateQuery,
    mergeEntityChanges,
    updateMutationStateAndEntities,
    updateQueryStateAndEntities,
  } = (Object.keys(actions) as (keyof TypedActions)[]).reduce(
    (result, key) => {
      const fn = actions[key]
      result[key] = function () {
        // @ts-expect-error TODO fix types
        const action = fn.apply(undefined, arguments)
        // @ts-expect-error TODO fix types
        return dispatch(action)
      }
      return result
    },
    {} as {[key in keyof TypedActions]: (...args: Parameters<TypedActions[key]>) => void},
  )

  const {query, mutate} = bindAsyncActions(privateCache, innerStore, store)

  return {
    // doc-header
    actions: {
      /**
       * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
       * @param onlyIfExpired When true, cancels fetch if result is not yet expired.
       * @param skipFetch Fetch is cancelled and current cached result is returned.
       */
      query,
      /** Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished succesfully. */
      mutate,
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
    } satisfies Record<keyof TypedActions, unknown> & {
      query: unknown
      mutate: unknown
    },
  }
}
