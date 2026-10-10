import type { Cache, CacheState, EntityChanges, MutateOptions, MutationResult, MutationState, QueryOptions, QueryResult, QueryState, ReduxStoreLike, Typenames } from '../types';
/** Initializes cache for Redux, returning reducer, actions, async actions and utils. */
export declare const initializeForRedux: <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR>(cache: Cache<N, SK, T, QP, QR, MP, MR>) => {
    /** Reducer of the cache, should be added to Redux store. */
    reducer: (state: CacheState<T, QP, QR, MP, MR> | undefined, action: {
        type: `@rrc/${N}/updateQueryStateAndEntities`;
        queryKey: keyof QP & keyof QR;
        queryCacheKey: PropertyKey;
        state: Partial<QueryState<T, QP[keyof QP & keyof QR], QR[keyof QP & keyof QR]>> | undefined;
        entityChanges: EntityChanges<T> | undefined;
    } | {
        type: `@rrc/${N}/updateMutationStateAndEntities`;
        mutationKey: keyof MP & keyof MR;
        state: Partial<MutationState<T, MP[keyof MP & keyof MR], MR[keyof MP & keyof MR]>> | undefined;
        entityChanges: EntityChanges<T> | undefined;
    } | {
        type: `@rrc/${N}/mergeEntityChanges`;
        changes: EntityChanges<T>;
    } | {
        type: `@rrc/${N}/invalidateQuery`;
        queries: {
            query: keyof QP & keyof QR;
            cacheKey?: PropertyKey;
            expiresAt?: number;
        }[];
    } | {
        type: `@rrc/${N}/clearQueryState`;
        queries: {
            query: keyof QP & keyof QR;
            cacheKey?: PropertyKey;
        }[];
    } | {
        type: `@rrc/${N}/clearMutationState`;
        mutationKeys: (keyof MP & keyof MR)[];
    } | {
        type: `@rrc/${N}/clearCache`;
        stateToKeep: Partial<CacheState<T, QP, QR, MP, MR>> | undefined;
    }) => CacheState<T, QP, QR, MP, MR>;
    actions: {
        /** Updates query state, and optionally merges entity changes in a single action. */
        updateQueryStateAndEntities: {
            <K extends keyof QP & keyof QR>(queryKey: K, queryCacheKey: PropertyKey, state?: Partial<QueryState<T, QP[K], QR[K]>> | undefined, entityChanges?: EntityChanges<T> | undefined): {
                type: `@rrc/${N}/updateQueryStateAndEntities`;
                queryKey: K;
                queryCacheKey: PropertyKey;
                state: Partial<QueryState<T, QP[K], QR[K]>> | undefined;
                entityChanges: EntityChanges<T> | undefined;
            };
            type: `@rrc/${N}/updateQueryStateAndEntities`;
        };
        /** Updates mutation state, and optionally merges entity changes in a single action. */
        updateMutationStateAndEntities: {
            <K extends keyof MP & keyof MR>(mutationKey: K, state?: Partial<MutationState<T, MP[K], MR[K]>> | undefined, entityChanges?: EntityChanges<T> | undefined): {
                type: `@rrc/${N}/updateMutationStateAndEntities`;
                mutationKey: K;
                state: Partial<MutationState<T, MP[K], MR[K]>> | undefined;
                entityChanges: EntityChanges<T> | undefined;
            };
            type: `@rrc/${N}/updateMutationStateAndEntities`;
        };
        /** Merges EntityChanges to the state. */
        mergeEntityChanges: {
            (changes: EntityChanges<T>): {
                type: `@rrc/${N}/mergeEntityChanges`;
                changes: EntityChanges<T>;
            };
            type: `@rrc/${N}/mergeEntityChanges`;
        };
        /** Sets expiresAt to Date.now(). */
        invalidateQuery: {
            <K extends keyof QP & keyof QR>(queries: {
                query: K;
                cacheKey?: PropertyKey;
                expiresAt?: number;
            }[]): {
                type: `@rrc/${N}/invalidateQuery`;
                queries: {
                    query: K;
                    cacheKey?: PropertyKey;
                    expiresAt?: number;
                }[];
            };
            type: `@rrc/${N}/invalidateQuery`;
        };
        /** Clears states for provided query keys and cache keys.
         * If cache key for query key is not provided, the whole state for query key is cleared. */
        clearQueryState: {
            <K extends keyof QP & keyof QR>(queries: {
                query: K;
                cacheKey?: PropertyKey;
            }[]): {
                type: `@rrc/${N}/clearQueryState`;
                queries: {
                    query: K;
                    cacheKey?: PropertyKey;
                }[];
            };
            type: `@rrc/${N}/clearQueryState`;
        };
        /** Clears states for provided mutation keys. */
        clearMutationState: {
            <K extends keyof MP & keyof MR>(mutationKeys: K[]): {
                type: `@rrc/${N}/clearMutationState`;
                mutationKeys: K[];
            };
            type: `@rrc/${N}/clearMutationState`;
        };
        /** Replaces cache state with initial, optionally merging with provided state. Doesn't cancel running fetches and should be used with caution. */
        clearCache: {
            (stateToKeep?: Partial<CacheState<T, QP, QR, MP, MR>> | undefined): {
                type: `@rrc/${N}/clearCache`;
                stateToKeep: Partial<CacheState<T, QP, QR, MP, MR>> | undefined;
            };
            type: `@rrc/${N}/clearCache`;
        };
    };
    /**
     * Asynchronous logic. No `redux-thunk` needed - just pass the store from `useStore`.
     * Also consider using `bindAsyncActions` util or `useClient` from React initialization. */
    asyncActions: {
        /**
         * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
         * @param onlyIfExpired When true, cancels fetch if result is not yet expired.
         * @param skipFetch Fetch is cancelled and current cached result is returned.
         */
        query: <QK extends keyof (QP & QR)>(store: ReduxStoreLike, options: QueryOptions<T, QP, QR, QK>) => Promise<QueryResult<QK extends keyof QP & keyof QR ? QR[QK] : never>>;
        /**
         * Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished succesfully.
         */
        mutate: <MK extends keyof (MP & MR)>(store: ReduxStoreLike, options: MutateOptions<T, MP, MR, MK>) => Promise<MutationResult<MK extends keyof MP & keyof MR ? MR[MK] : never>>;
    };
    utils: {
        /** Binds async actions to the store. Can be used when the store is a singleton for direct import. */
        bindAsyncActions: (store: ReduxStoreLike) => {
            query: <QK extends keyof QP | keyof QR>(options: QueryOptions<T, QP, QR, QK>) => Promise<QueryResult<QK extends keyof QP & keyof QR ? QR[QK] : never>>;
            mutate: <MK extends keyof MP | keyof MR>(options: MutateOptions<T, MP, MR, MK>) => Promise<MutationResult<MK extends keyof MP & keyof MR ? MR[MK] : never>>;
        };
    };
};
