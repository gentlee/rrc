// Disabling this to import unused types to remove import() from generated types.
/* eslint-disable @typescript-eslint/no-unused-vars */

import {createActions} from './createActions'
import {createReducer} from './createReducer'
import {createSelectors} from './createSelectors'
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
} from './types'
import {CacheExtensions, CachePrivate, CacheToPrivate, InnerStore, StoreHooksPrivate} from './typesPrivate'
import {
  applyEntityChanges,
  createStateComparer,
  defaultGetCacheKey,
  EMPTY_OBJECT,
  FetchPolicy,
  IS_DEV,
  logWarn,
  optionalUtils,
} from './utilsAndConstants'

/**
 * Function to provide generic Typenames if normalization is needed.
 * Returns object with createCache function with provided typenames.
 * @example
 * const cache = withTypenames<MyTypenames>().createCache({...})
 */
export const withTypenames = <WT extends Typenames = Typenames>() => {
  return {
    /** Creates cache with selectors, utils and full config with all default values set, that should be used for further initialization for specific stores and UI libs. */
    createCache: <
      N extends string = string,
      SK extends string = string,
      T extends Typenames = WT,
      QP = unknown,
      QR = unknown,
      MP = unknown,
      MR = unknown,
    >(
      partialConfig: OptionalPartial<
        Omit<CacheConfig<N, SK, T, QP, QR, MP, MR>, 'globals'>,
        'options' | 'queries' | 'mutations'
      > & {
        globals?: OptionalPartial<CacheConfig<N, SK, T, QP, QR, MP, MR>['globals'], 'queries'>
      },
    ) => {
      type TypedConfig = CacheConfig<N, SK, T, QP, QR, MP, MR>
      type RootState = SK extends '.' | ''
        ? CacheState<T, QP, QR, MP, MR>
        : {[key in SK]: CacheState<T, QP, QR, MP, MR>}

      const abortControllers = new WeakMap<InnerStore, Record<PropertyKey, AbortController>>()

      // Provide all optional fields

      partialConfig.options ??= {} as CacheOptions
      partialConfig.options.mutableCollections ??= false
      partialConfig.options.logsEnabled ??= false
      partialConfig.options.additionalValidation ??= IS_DEV
      partialConfig.options.deepComparisonEnabled ??= true
      partialConfig.globals ??= {}
      partialConfig.globals.queries ??= {} as Globals<T>['queries']
      partialConfig.globals.queries.fetchPolicy ??= FetchPolicy.NoCacheOrExpired
      partialConfig.globals.queries.skipFetch ??= false
      partialConfig.mutations ??= {} as TypedConfig['mutations']
      partialConfig.queries ??= {} as TypedConfig['queries']

      const config = partialConfig as TypedConfig
      const {globals, cacheStateKey, queries, options} = config

      const isRootState = cacheStateKey === '.' || cacheStateKey === ''

      // Validate options

      if (options.deepComparisonEnabled && !optionalUtils.deepEqual) {
        logWarn(
          'createCache',
          'optional dependency for fast-deep-equal was not provided, while deepComparisonEnabled option is true',
        )
      }

      // State comparers

      setDefaultComparer(globals.queries)
      for (const queryKey in queries) {
        // @ts-expect-error TODO fix types
        setDefaultComparer(queries[queryKey as keyof TypedConfig['queries']])
      }

      // Selectors

      // @ts-expect-error TODO fix types
      const selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR> = isRootState
        ? (state: CacheState<T, QP, QR, MP, MR>) => state
        : (state: {[cacheStateKey]: CacheState<T, QP, QR, MP, MR>}) => state[cacheStateKey]

      const selectors = createSelectors(selectCacheState)
      const {
        selectQueryState,
        selectQueryResult,
        selectQueryLoading,
        selectQueryError,
        selectQueryParams,
        selectQueryExpiresAt,
        selectMutationState,
        selectMutationResult,
        selectMutationLoading,
        selectMutationError,
        selectMutationParams,
        selectEntityById,
        selectEntities,
        selectEntitiesByTypename,
      } = selectors

      // Actions

      const actions = createActions<N, T, QP, QR, MP, MR>(config.name)

      // Reducer

      const reducer = createReducer<N, T, QP, QR, MP, MR>(
        actions,
        Object.keys(queries) as (keyof (QP | QR))[],
        options,
      )

      // Utils

      // @ts-expect-error TODO fix types
      const getRootState: (cacheState: CacheState<T, QP, QR, MP, MR>) => RootState = isRootState
        ? (state) => state
        : (state) => ({[cacheStateKey]: state})

      const getInitialState = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = reducer(undefined, EMPTY_OBJECT as any)
        return getRootState(state)
      }

      const cache = {
        // doc-ignore
        /** Keeps config, passed while creating the cache, with all default values set. */
        config,
        // doc-header
        selectors: {
          /** Selects cache state from the root state. Depends on `cacheStateKey`. */
          selectCacheState,
          /** Selects query state. */
          selectQueryState,
          /** Selects query latest result. */
          selectQueryResult,
          /** Selects query loading state. */
          selectQueryLoading,
          /** Selects query latest error. */
          selectQueryError,
          /** Selects query latest params. */
          selectQueryParams,
          /** Selects query latest expiresAt. */
          selectQueryExpiresAt,
          /** Selects mutation state. */
          selectMutationState,
          /** Selects mutation latest result. */
          selectMutationResult,
          /** Selects mutation loading state. */
          selectMutationLoading,
          /** Selects mutation latest error. */
          selectMutationError,
          /** Selects mutation latest params. */
          selectMutationParams,
          /** Selects entity by id and typename. */
          selectEntityById,
          /** Selects all entities. */
          selectEntities,
          /** Selects all entities of provided typename. */
          selectEntitiesByTypename,
        },
        // doc-header
        utils: {
          /**
           * Apply changes to the entities map.
           * Returns `undefined` if nothing to change, otherwise new `EntitiesMap<T>` with applied changes.
           * Uses deep comparison if `deepComparisonEnabled` option is `true`.
           * Performs additional checks for intersections if `additionalValidation` option is `true`, and prints warnings if finds any issues.
           */
          applyEntityChanges: (
            entities: Parameters<typeof applyEntityChanges<T>>[0],
            changes: Parameters<typeof applyEntityChanges<T>>[1],
          ) => {
            return applyEntityChanges<T>(entities, changes, options)
          },
          /** Generates the initial root state using `cacheStateKey`. Not needed for Redux — it automatically generates it when creating the store by calling the root reducer. */
          getInitialState,
        },
      }

      // Set private fields

      const privateCache = cache as CachePrivate<N, SK, T, QP, QR, MP, MR>
      privateCache.reducer = reducer
      privateCache.actions = actions
      privateCache.abortControllers = abortControllers
      privateCache.utils.getRootState = getRootState

      return cache
    },
  }
}

const setDefaultComparer = <T extends Typenames, P, R>(
  target:
    | {
        selectorComparer?: QueryStateComparer<T, P, R> | (keyof QueryState)[]
      }
    | undefined,
) => {
  if (target?.selectorComparer != null && typeof target.selectorComparer === 'object') {
    target.selectorComparer = createStateComparer(target.selectorComparer)
  }
}

// doc-ignore
/**
 * Creates cache that handles all logic for fetching and caching queries and mutations for immutable stores.
 * Returns selectors and utils. Should be additionally initialized for the store (Redux or Zustand) and optionally for the UI lib (React).
 * */
export const createCache = withTypenames().createCache
