import type {
  CacheConfig,
  CacheOptions,
  CacheState,
  EntitiesMap,
  EntityChanges,
  Globals,
  Mutable,
  MutationInfo,
  MutationState,
  NormalizedQueryResponse,
  OptionalPartial,
  QueryInfo,
  QueryState,
  Typenames,
} from './types'
import {applyEntityChanges} from './utilsAndConstants'

/**
 * Function to provide generic Typenames if normalization is needed.
 * Returns object with createCache function with provided typenames.
 * @example
 * const cache = withTypenames<MyTypenames>().createCache({...})
 */
export declare const withTypenames: <WT extends Typenames = Typenames>() => {
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
    /** Keeps config, passed while creating the cache, with all default values set. */
    config: CacheConfig<N, SK, T, QP, QR, MP, MR>
    selectors: {
      /** Selects cache state from the root state. Depends on `cacheStateKey`. */
      selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR>
      /** Selects query state. */
      selectQueryState: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => QueryState<
        T,
        QK extends keyof QP & keyof QR ? QP[QK] : never,
        QK extends keyof QP & keyof QR ? QR[QK] : never
      >
      /** Selects query latest result. */
      selectQueryResult: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => (QK extends keyof QP & keyof QR ? QR[QK] : never) | undefined
      /** Selects query loading state. */
      selectQueryLoading: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => false | Promise<NormalizedQueryResponse<T, QK extends keyof QP & keyof QR ? QR[QK] : never>>
      /** Selects query latest error. */
      selectQueryError: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => Error | undefined
      /** Selects query latest params. */
      selectQueryParams: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => (QK extends keyof QP & keyof QR ? QP[QK] : never) | undefined
      /** Selects query latest expiresAt. */
      selectQueryExpiresAt: <QK extends keyof QP | keyof QR>(
        state: unknown,
        query: QK,
        cacheKey: PropertyKey,
      ) => number | undefined
      /** Selects mutation state. */
      selectMutationState: <MK extends keyof MP | keyof MR>(
        state: unknown,
        mutation: MK,
      ) => MutationState<
        T,
        MK extends keyof MP & keyof MR ? MP[MK] : never,
        MK extends keyof MP & keyof MR ? MR[MK] : never
      >
      /** Selects mutation latest result. */
      selectMutationResult: <MK extends keyof MP | keyof MR>(
        state: unknown,
        mutation: MK,
      ) => (MK extends keyof MP & keyof MR ? MR[MK] : never) | undefined
      /** Selects mutation loading state. */
      selectMutationLoading: <MK extends keyof MP | keyof MR>(
        state: unknown,
        mutation: MK,
      ) => false | Promise<NormalizedQueryResponse<T, MK extends keyof MP & keyof MR ? MR[MK] : never>>
      /** Selects mutation latest error. */
      selectMutationError: <MK extends keyof MP | keyof MR>(state: unknown, mutation: MK) => Error | undefined
      /** Selects mutation latest params. */
      selectMutationParams: <MK extends keyof MP | keyof MR>(
        state: unknown,
        mutation: MK,
      ) => (MK extends keyof MP & keyof MR ? MP[MK] : never) | undefined
      /** Selects entity by id and typename. */
      selectEntityById: <TN extends keyof T>(
        state: unknown,
        id: PropertyKey | null | undefined,
        typename: TN,
      ) => T[TN] | undefined
      /** Selects all entities. */
      selectEntities: (state: unknown) => EntitiesMap<T> & Mutable
      /** Selects all entities of provided typename. */
      selectEntitiesByTypename: <TN extends keyof T>(
        state: unknown,
        typename: TN,
      ) => (EntitiesMap<T> & Mutable)[TN]
    }
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
      ) => EntitiesMap<T> | undefined
      /** Generates the initial root state using `cacheStateKey`. Not needed for Redux — it automatically generates it when creating the store by calling the root reducer. */
      getInitialState: () => SK extends '' | '.'
        ? CacheState<T, QP, QR, MP, MR>
        : {[key in SK]: CacheState<T, QP, QR, MP, MR>}
    }
  }
}

/**
 * Creates cache that handles all logic for fetching and caching queiries and mutations for immutable stores.
 * Returns selectors and utils. Should be additionally initialized for the store (Redux or Zustand) and optionally for the UI lib (React).
 * */
export declare const createCache: <
  N extends string = string,
  SK extends string = string,
  T extends Typenames = Typenames,
  QP = unknown,
  QR = unknown,
  MP = unknown,
  MR = unknown,
>(
  partialConfig: Partial<{
    queries: Partial<{
      [QK in keyof (QP & QR)]: QK extends keyof QP & keyof QR ? QueryInfo<T, QP[QK], QR[QK]> : never
    }>
    mutations: Partial<{
      [MK in keyof (MP & MR)]: MK extends keyof MP & keyof MR ? MutationInfo<T, MP[MK], MR[MK]> : never
    }>
    options: Partial<CacheOptions>
  }> &
    Omit<Omit<CacheConfig<N, SK, T, QP, QR, MP, MR>, 'globals'>, 'queries' | 'mutations' | 'options'> & {
      globals?: OptionalPartial<Globals<T>, 'queries'> | undefined
    },
) => {
  /** Keeps config, passed while creating the cache, with all default values set. */
  config: CacheConfig<N, SK, T, QP, QR, MP, MR>
  selectors: {
    /** Selects cache state from the root state. Depends on `cacheStateKey`. */
    selectCacheState: (state: unknown) => CacheState<T, QP, QR, MP, MR>
    /** Selects query state. */
    selectQueryState: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => QueryState<
      T,
      QK_1 extends keyof QP & keyof QR ? QP[QK_1] : never,
      QK_1 extends keyof QP & keyof QR ? QR[QK_1] : never
    >
    /** Selects query latest result. */
    selectQueryResult: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => (QK_1 extends keyof QP & keyof QR ? QR[QK_1] : never) | undefined
    /** Selects query loading state. */
    selectQueryLoading: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => false | Promise<NormalizedQueryResponse<T, QK_1 extends keyof QP & keyof QR ? QR[QK_1] : never>>
    /** Selects query latest error. */
    selectQueryError: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => Error | undefined
    /** Selects query latest params. */
    selectQueryParams: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => (QK_1 extends keyof QP & keyof QR ? QP[QK_1] : never) | undefined
    /** Selects query latest expiresAt. */
    selectQueryExpiresAt: <QK_1 extends keyof QP | keyof QR>(
      state: unknown,
      query: QK_1,
      cacheKey: PropertyKey,
    ) => number | undefined
    /** Selects mutation state. */
    selectMutationState: <MK_1 extends keyof MP | keyof MR>(
      state: unknown,
      mutation: MK_1,
    ) => MutationState<
      T,
      MK_1 extends keyof MP & keyof MR ? MP[MK_1] : never,
      MK_1 extends keyof MP & keyof MR ? MR[MK_1] : never
    >
    /** Selects mutation latest result. */
    selectMutationResult: <MK_1 extends keyof MP | keyof MR>(
      state: unknown,
      mutation: MK_1,
    ) => (MK_1 extends keyof MP & keyof MR ? MR[MK_1] : never) | undefined
    /** Selects mutation loading state. */
    selectMutationLoading: <MK_1 extends keyof MP | keyof MR>(
      state: unknown,
      mutation: MK_1,
    ) => false | Promise<NormalizedQueryResponse<T, MK_1 extends keyof MP & keyof MR ? MR[MK_1] : never>>
    /** Selects mutation latest error. */
    selectMutationError: <MK_1 extends keyof MP | keyof MR>(
      state: unknown,
      mutation: MK_1,
    ) => Error | undefined
    /** Selects mutation latest params. */
    selectMutationParams: <MK_1 extends keyof MP | keyof MR>(
      state: unknown,
      mutation: MK_1,
    ) => (MK_1 extends keyof MP & keyof MR ? MP[MK_1] : never) | undefined
    /** Selects entity by id and typename. */
    selectEntityById: <TN extends keyof T>(
      state: unknown,
      id: PropertyKey | null | undefined,
      typename: TN,
    ) => T[TN] | undefined
    /** Selects all entities. */
    selectEntities: (state: unknown) => EntitiesMap<T> & Mutable
    /** Selects all entities of provided typename. */
    selectEntitiesByTypename: <TN extends keyof T>(
      state: unknown,
      typename: TN,
    ) => (EntitiesMap<T> & Mutable)[TN]
  }
  utils: {
    /**
     * Apply changes to the entities map.
     * Returns `undefined` if nothing to change, otherwise new `EntitiesMap<T>` with applied changes.
     * Uses deep comparison if `deepComparisonEnabled` option is `true`.
     * Performs additional checks for intersections if `additionalValidation` option is `true`, and prints warnings if finds any issues.
     */
    applyEntityChanges: (
      entities: EntitiesMap<T> & Mutable,
      changes: EntityChanges<T>,
    ) => EntitiesMap<T> | undefined
    /** Generates the initial root state using `cacheStateKey`. Not needed for Redux — it automatically generates it when creating the store by calling the root reducer. */
    getInitialState: () => SK extends '' | '.'
      ? CacheState<T, QP, QR, MP, MR>
      : {[key in SK]: CacheState<T, QP, QR, MP, MR>}
  }
}
