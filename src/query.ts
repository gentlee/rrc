import type {AnyStore, Key, QueryResult, Typenames} from './types'
import {CachePrivate, InnerStore} from './typesPrivate'
import {logDebug, noop} from './utilsAndConstants'

export const query = async <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  QK extends keyof (QP & QR),
>(
  logTag: string,
  innerStore: InnerStore,
  externalStore: AnyStore,
  cache: Pick<CachePrivate<N, SK, T, QP, QR, MP, MR>, 'config' | 'actions' | 'selectors'>,
  queryKey: QK,
  cacheKey: Key,
  params: QK extends keyof (QP | QR) ? QP[QK] : never,
  onlyIfExpired: boolean | undefined,
  skipFetch: boolean | undefined,
  secondsToLive: number | undefined = cache.config.queries[queryKey].secondsToLive ??
    cache.config.globals.queries.secondsToLive,
  mergeResults = cache.config.queries[queryKey].mergeResults,
  onCompleted = cache.config.queries[queryKey].onCompleted,
  onSuccess = cache.config.queries[queryKey].onSuccess,
  onError = cache.config.queries[queryKey].onError,
): Promise<QueryResult<QK extends keyof (QP | QR) ? QR[QK] : never>> => {
  const {
    config: {
      options: {logsEnabled},
      queries,
      globals,
    },
    actions,
    selectors: {selectQueryResult, selectQueryState},
  } = cache

  const queryStateOnStart = selectQueryState(innerStore.getState(), queryKey, cacheKey)

  if (skipFetch) {
    return {result: queryStateOnStart.result}
  }

  if (queryStateOnStart?.loading) {
    logsEnabled &&
      logDebug(`${logTag} fetch cancelled: already loading`, {queryStateOnStart, params, cacheKey})

    const error = await queryStateOnStart.loading.then(noop).catch(catchAndReturn)
    const result = selectQueryResult(innerStore.getState(), queryKey, cacheKey)
    const cancelled = 'loading'
    return error ? {cancelled, result, error} : {cancelled, result}
  }

  if (onlyIfExpired && queryStateOnStart?.expiresAt != null && queryStateOnStart.expiresAt > Date.now()) {
    logsEnabled &&
      logDebug(`${logTag} fetch cancelled: not expired yet`, {
        queryStateOnStart,
        params,
        cacheKey,
        onlyIfExpired,
      })

    return {cancelled: 'not-expired', result: queryStateOnStart.result}
  }

  const {updateQueryStateAndEntities} = actions

  let fetchPromise
  let response
  let error: Error | undefined
  try {
    fetchPromise = queries[queryKey].query(
      // @ts-expect-error fix later
      params,
      externalStore,
    )
  } catch (e) {
    error = e as Error
  }

  if (!error) {
    innerStore.dispatch(
      updateQueryStateAndEntities(queryKey as keyof (QP | QR), cacheKey, {
        loading: fetchPromise,
        params,
        error,
      }),
    )

    logsEnabled &&
      logDebug(`${logTag} started`, {queryKey, params, cacheKey, queryStateOnStart, onlyIfExpired})

    try {
      response = await fetchPromise
    } catch (e) {
      error = e as Error
    }
  }

  if (error) {
    innerStore.dispatch(
      updateQueryStateAndEntities(queryKey as keyof (QP | QR), cacheKey, {
        error,
        loading: undefined,
        params,
      }),
    )
    // @ts-expect-error params
    if (!onError?.(error, params, externalStore)) {
      globals.onError?.(
        error,
        // @ts-expect-error queryKey
        queryKey,
        params,
        externalStore,
      )
    }
    onCompleted?.(
      undefined,
      error,
      // @ts-expect-error params
      params,
      externalStore,
    )
    return {error, result: selectQueryResult(innerStore.getState(), queryKey, cacheKey)}
  }

  if (response) {
    const newState = {
      error: undefined,
      loading: undefined,
      expiresAt:
        response.expiresAt ?? (secondsToLive != null ? Date.now() + secondsToLive * 1000 : undefined),
      result: mergeResults
        ? mergeResults(
            // @ts-expect-error fix later
            selectQueryResult(innerStore.getState(), queryKey, cacheKey),
            response,
            params,
            externalStore,
          )
        : response.result,
    }
    innerStore.dispatch(
      updateQueryStateAndEntities(queryKey as keyof (QP | QR), cacheKey, newState, response),
    )
    onSuccess?.(
      // @ts-expect-error response
      response,
      params,
      externalStore,
    )
    onCompleted?.(
      // @ts-expect-error response
      response,
      undefined,
      params,
      externalStore,
    )

    // @ts-expect-error fix types
    return {result: newState?.result}
  }

  throw new Error(`${logTag}: both error and response are not defined`)
}

const catchAndReturn = (x: unknown) => x
