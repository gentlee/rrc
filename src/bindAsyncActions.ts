import {mutate as mutateImpl} from './mutate'
import {query as queryImpl} from './query'
import type {AnyStore, MutateOptions, MutationResult, QueryOptions, QueryResult, Typenames} from './types'
import {CachePrivate, InnerStore} from './typesPrivate'
import {defaultGetCacheKey} from './utilsAndConstants'

export const bindAsyncActions = <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR>(
  cache: Pick<
    CachePrivate<N, SK, T, QP, QR, MP, MR>,
    'abortControllers' | 'config' | 'selectors' | 'actions'
  >,
  innerStore: InnerStore,
  externalStore: AnyStore,
) => {
  const {
    config: {queries},
  } = cache

  return {
    /**
     * Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.
     * @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.
     * @param skipFetch Fetch is cancelled and current cached result is returned.
     */
    query: <QK extends keyof (QP & QR)>(options: QueryOptions<T, QP, QR, QK>) => {
      type P = QK extends keyof (QP | QR) ? QP[QK] : never
      type R = QK extends keyof (QP | QR) ? QR[QK] : never

      const {query: queryKey, params} = options
      const getCacheKey = queries[queryKey].getCacheKey ?? defaultGetCacheKey<P>
      // @ts-expect-error fix later
      const cacheKey = getCacheKey(params)

      return queryImpl(
        'query',
        innerStore,
        externalStore,
        cache,
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
    mutate: <MK extends keyof (MP & MR)>(options: MutateOptions<T, MP, MR, MK>) => {
      type R = MK extends keyof (MP | MR) ? MR[MK] : never

      return mutateImpl(
        'mutate',
        innerStore,
        externalStore,
        cache,
        options.mutation,
        options.params,
        // @ts-expect-error fix later
        options.onCompleted,
        options.onSuccess,
        options.onError,
      ) as Promise<MutationResult<R>>
    },
  }
}
