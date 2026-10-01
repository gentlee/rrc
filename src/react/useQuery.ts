import {useCallback, useEffect} from 'react'

import {query as queryImpl} from '../query'
import {QueryOptions, QueryState, QueryStateComparer, Typenames, UseQueryOptions} from '../types'
import {CachePrivate} from '../typesPrivate'
import {createStateComparer, defaultGetCacheKey, EMPTY_OBJECT, logDebug} from '../utilsAndConstants'
import {validateStoreHooks} from './utils'

export const useQuery = <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  QK extends keyof (QP & QR),
>(
  cache: Pick<CachePrivate<N, SK, T, QP, QR, MP, MR>, 'config' | 'actions' | 'selectors' | 'extensions'>,
  useQueryOptions: UseQueryOptions<T, QK, QP, QR>,
) => {
  type P = QK extends keyof (QP | QR) ? QP[QK] : never
  type R = QK extends keyof (QP | QR) ? QR[QK] : never

  const {
    extensions,
    config: {queries, globals, options: configOptions},
    selectors: {selectQueryState},
  } = cache

  const {
    query: queryKey,
    skipFetch = false,
    params,
    selectorComparer,
    secondsToLive,
    mergeResults,
    onCompleted,
    onSuccess,
    onError,
    fetchPolicy = queries[queryKey].fetchPolicy ?? globals.queries.fetchPolicy,
  } = useQueryOptions

  validateStoreHooks(extensions)
  const {useStore, useSelector, useExternalStore} = extensions!.react!.storeHooks
  const innerStore = useStore()
  const externalStore = useExternalStore()

  const queryInfo = queries[queryKey]

  const logsEnabled = configOptions.logsEnabled
  const getCacheKey = queryInfo.getCacheKey ?? defaultGetCacheKey<P>
  const comparer =
    selectorComparer === undefined
      ? ((queryInfo.selectorComparer as QueryStateComparer<T, P, R>) ??
        (globals.queries.selectorComparer as QueryStateComparer<T, P, R>) ??
        defaultStateComparer)
      : typeof selectorComparer === 'function'
        ? selectorComparer
        : createStateComparer(selectorComparer)

  // @ts-expect-error fix types later
  const cacheKey = getCacheKey(params)

  /** Run query with the new parameters, or refetch with the same if parameters not provided. */
  const query = useCallback(
    async (options?: Partial<Pick<QueryOptions<T, QP, QR, QK>, 'params' | 'onlyIfExpired'>>) => {
      const paramsPassed = options && 'params' in options
      return await queryImpl(
        'useQuery.query',
        innerStore,
        externalStore,
        cache,
        queryKey,
        // @ts-expect-error fix later
        paramsPassed ? getCacheKey(options.params) : cacheKey,
        paramsPassed ? options.params! : params, // params type can also have null | undefined, thats why we don't check for it here
        options?.onlyIfExpired,
        false,
        secondsToLive,
        // @ts-expect-error fix later
        mergeResults,
        onCompleted,
        onSuccess,
        onError,
      )
    },
    [
      cache,
      queryKey,
      cacheKey,
      innerStore,
      externalStore,
      params,
      secondsToLive,
      getCacheKey,
      mergeResults,
      onCompleted,
      onError,
      onSuccess,
    ],
  )

  /** Query state */
  const queryState =
    useSelector((state: unknown) => {
      return selectQueryState(state, queryKey, cacheKey) as QueryState<T, P, R> | undefined // TODO proper type
    }, comparer) ?? (EMPTY_OBJECT as QueryState<T, P, R>)

  useEffect(() => {
    if (skipFetch) {
      logsEnabled && logDebug('useQuery.useEffect skip fetch', {skipFetch, queryKey, cacheKey})
      return
    }

    const expired = queryState.expiresAt != null && queryState.expiresAt <= Date.now()
    if (
      !fetchPolicy(
        expired,
        // @ts-expect-error params
        params,
        queryState,
        externalStore,
      )
    ) {
      logsEnabled &&
        logDebug('useQuery.useEffect skip fetch due to fetch policy', {
          queryState,
          expired,
          queryKey,
          cacheKey,
        })
      return
    }

    query()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, cacheKey, skipFetch])

  logsEnabled && logDebug('useQuery', {cacheKey, options: useQueryOptions, queryState})

  return [queryState as Omit<QueryState<T, P, R>, 'expiresAt'>, query] as const
}

const defaultStateComparer = createStateComparer(['result', 'loading', 'params', 'error'])
