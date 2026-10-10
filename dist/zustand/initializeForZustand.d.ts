import type { Cache, CacheState, EntityChanges, MutateOptions, MutationResult, MutationState, QueryOptions, QueryResult, QueryState, Typenames, ZustandStoreLike } from '../types';
/** Initializes cache for Zustand, returning actions. */
export declare const initializeForZustand: <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR, S = unknown>(cache: Cache<N, SK, T, QP, QR, MP, MR>, store: ZustandStoreLike<S>) => {
    actions: {
        /**
         * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
         * @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.
         * @param skipFetch Fetch is cancelled and current cached result is returned.
         */
        query: <QK extends keyof QP | keyof QR>(options: QueryOptions<T, QP, QR, QK>) => Promise<QueryResult<QK extends keyof QP & keyof QR ? QR[QK] : never>>;
        /** Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished successfully. */
        mutate: <MK extends keyof MP | keyof MR>(options: MutateOptions<T, MP, MR, MK>) => Promise<MutationResult<MK extends keyof MP & keyof MR ? MR[MK] : never>>;
        /** Updates query state, and optionally merges entity changes in a single action. */
        updateQueryStateAndEntities: (queryKey: keyof QP & keyof QR, queryCacheKey: PropertyKey, state?: Partial<QueryState<T, QP[keyof QP & keyof QR], QR[keyof QP & keyof QR]>> | undefined, entityChanges?: EntityChanges<T> | undefined) => void;
        /** Updates mutation state, and optionally merges entity changes in a single action. */
        updateMutationStateAndEntities: (mutationKey: keyof MP & keyof MR, state?: Partial<MutationState<T, MP[keyof MP & keyof MR], MR[keyof MP & keyof MR]>> | undefined, entityChanges?: EntityChanges<T> | undefined) => void;
        /** Merges EntityChanges to the state. */
        mergeEntityChanges: (changes: EntityChanges<T>) => void;
        /** Sets expiresAt to Date.now(). */
        invalidateQuery: (queries: {
            query: keyof QP & keyof QR;
            cacheKey?: PropertyKey;
            expiresAt?: number;
        }[]) => void;
        /** Clears states for provided query keys and cache keys.
         * If cache key for query key is not provided, the whole state for query key is cleared. */
        clearQueryState: (queries: {
            query: keyof QP & keyof QR;
            cacheKey?: PropertyKey;
        }[]) => void;
        /** Clears states for provided mutation keys. */
        clearMutationState: (mutationKeys: (keyof MP & keyof MR)[]) => void;
        /** Replaces cache state with initial, optionally merging with provided state. Doesn't cancel running fetches and should be used with caution. */
        clearCache: (stateToKeep?: Partial<CacheState<T, QP, QR, MP, MR>> | undefined) => void;
    };
};
