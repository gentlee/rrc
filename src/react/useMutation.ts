import {useCallback, useMemo} from 'react'

import {mutate as mutateImpl} from '../mutate'
import {MutateOptions, MutationState, Typenames} from '../types'
import {CachePrivate} from '../typesPrivate'
import {EMPTY_OBJECT, logDebug} from '../utilsAndConstants'
import {validateStoreHooks} from './utils'

export const useMutation = <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  MK extends keyof (MP & MR),
>(
  cache: Pick<
    CachePrivate<N, SK, T, QP, QR, MP, MR>,
    'abortControllers' | 'actions' | 'selectors' | 'config' | 'extensions'
  >,
  options: Omit<MutateOptions<T, MP, MR, MK>, 'params'>,
) => {
  type P = MK extends keyof (MP | MR) ? MP[MK] : never
  type R = MK extends keyof (MP | MR) ? MP[MK] : never

  const {config, extensions} = cache

  const {mutation: mutationKey, onCompleted, onSuccess, onError} = options

  validateStoreHooks(extensions)
  const {useStore, useExternalStore, useSelector} = extensions!.react!.storeHooks
  const innerStore = useStore()
  const externalStore = useExternalStore()

  const mutate = useCallback(
    async (params: P) => {
      return mutateImpl(
        'useMutation.mutate',
        innerStore,
        externalStore,
        cache,
        mutationKey,
        params,
        // @ts-expect-error fix later
        onCompleted,
        onSuccess,
        onError,
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationKey, innerStore, externalStore, onCompleted, onSuccess, onError],
  )

  const [mutationStateSelector, abort] = useMemo(() => {
    const mutationStateSelectorFromUseMutation = (state: unknown) =>
      cache.selectors.selectMutationState(state, mutationKey)
    const abortFromUseMutation = () => {
      const abortController = cache.abortControllers.get(innerStore)?.[mutationKey]
      if (abortController === undefined || abortController.signal.aborted) {
        return false
      }
      abortController.abort()
      innerStore.dispatch(
        cache.actions.updateMutationStateAndEntities(mutationKey as keyof (MP | MR), {loading: undefined}),
      )
      return true
    }
    return [mutationStateSelectorFromUseMutation, abortFromUseMutation] as const
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutationKey, innerStore])

  // @ts-expect-error TODO fix types
  const mutationState: MutationState<T, P, R> = useSelector(mutationStateSelector) ?? EMPTY_OBJECT

  config.options.logsEnabled && logDebug('useMutation', {options, mutationState})

  return [mutate, mutationState, abort] as const
}
