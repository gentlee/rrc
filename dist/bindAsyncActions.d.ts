import type { AnyStore, MutateOptions, MutationResult, QueryOptions, QueryResult, Typenames } from './types';
import { CachePrivate, InnerStore } from './typesPrivate';
export declare const bindAsyncActions: <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR>(cache: Pick<CachePrivate<N, SK, T, QP, QR, MP, MR>, "abortControllers" | "config" | "selectors" | "actions">, innerStore: InnerStore, externalStore: AnyStore) => {
    /**
     * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
     * @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.
     * @param skipFetch Fetch is cancelled and current cached result is returned.
     */
    query: <QK extends keyof (QP & QR)>(options: QueryOptions<T, QP, QR, QK>) => Promise<QueryResult<QK extends keyof QP & keyof QR ? QR[QK] : never>>;
    /**
     * Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished successfully.
     */
    mutate: <MK extends keyof (MP & MR)>(options: MutateOptions<T, MP, MR, MK>) => Promise<MutationResult<MK extends keyof MP & keyof MR ? MR[MK] : never>>;
};
