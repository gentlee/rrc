import type {AnyStore, MutationResult, Typenames} from './types'
import {CachePrivate, InnerStore} from './typesPrivate'
import {logDebug} from './utilsAndConstants'

export const mutate = async <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  MK extends keyof (MP & MR),
>(
  logTag: string,
  innerStore: InnerStore,
  externalStore: AnyStore,
  {
    config: {mutations, options, globals},
    actions: {updateMutationStateAndEntities},
    abortControllers,
  }: Pick<CachePrivate<N, SK, T, QP, QR, MP, MR>, 'config' | 'actions' | 'abortControllers'>,
  mutationKey: MK,
  params: MK extends keyof (MP | MR) ? MP[MK] : never,
  onCompleted = mutations[mutationKey].onCompleted,
  onSuccess = mutations[mutationKey].onSuccess,
  onError = mutations[mutationKey].onError,
): Promise<MutationResult<MK extends keyof (MP | MR) ? MR[MK] : never>> => {
  let abortControllersOfStore = abortControllers.get(innerStore)
  if (abortControllersOfStore === undefined) {
    abortControllersOfStore = {}
    abortControllers.set(innerStore, abortControllersOfStore)
  }

  {
    const abortController = abortControllersOfStore[mutationKey]

    options.logsEnabled &&
      logDebug(logTag, {mutationKey, params, previousAborted: abortController !== undefined})

    if (abortController !== undefined) {
      abortController.abort()
    }
  }

  const abortController = new AbortController()
  abortControllersOfStore[mutationKey] = abortController

  let mutatePromise
  let response
  let error: Error | undefined
  try {
    mutatePromise = mutations[mutationKey].mutation(
      // @ts-expect-error fix later
      params,
      externalStore,
      abortController.signal,
    )
  } catch (e) {
    error = e as Error
  }

  if (!error) {
    innerStore.dispatch(
      updateMutationStateAndEntities(mutationKey as keyof (MP | MR), {
        // @ts-expect-error TODO fix types
        loading: mutatePromise,
        params,
        result: undefined,
        error,
      }),
    )

    try {
      response = await mutatePromise
    } catch (e) {
      error = e as Error
    }
  }

  options.logsEnabled &&
    logDebug(`${logTag} finished`, {response, error, aborted: abortController.signal.aborted})

  if (abortController.signal.aborted) {
    // Aborted manually, not by the next mutation which has already replaced the controller.
    if (abortControllersOfStore[mutationKey] === abortController) {
      delete abortControllersOfStore[mutationKey]
    }
    return ABORTED_RESULT
  }

  delete abortControllersOfStore[mutationKey]

  if (error) {
    innerStore.dispatch(
      updateMutationStateAndEntities(mutationKey as keyof (MP | MR), {
        params,
        error,
        loading: undefined,
      }),
    )

    // @ts-expect-error params
    if (!onError?.(error, params, externalStore)) {
      globals.onError?.(
        error,
        // @ts-expect-error mutationKey
        mutationKey,
        params,
        externalStore,
      )
    }
    onCompleted?.(
      // @ts-expect-error response
      response,
      error,
      params,
      externalStore,
    )

    return {error}
  }

  if (response) {
    const newState = {
      error: undefined,
      loading: undefined,
      result: response.result,
    }

    innerStore.dispatch(updateMutationStateAndEntities(mutationKey as keyof (MP | MR), newState, response))
    onSuccess?.(
      // @ts-expect-error response
      response,
      params,
      externalStore,
    )
    onCompleted?.(
      // @ts-expect-error response
      response,
      error,
      params,
      externalStore,
    )

    // @ts-expect-error fix later
    return {result: response.result}
  }

  throw new Error(`${logTag}: both error and response are not defined`)
}

const ABORTED_RESULT = Object.freeze({aborted: true})
