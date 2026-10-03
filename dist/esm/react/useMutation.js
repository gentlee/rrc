var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
import {useCallback, useMemo} from 'react'

import {mutate as mutateImpl} from '../mutate'
import {EMPTY_OBJECT, logDebug} from '../utilsAndConstants'
import {validateStoreHooks} from './utils'

export const useMutation = (cache, options) => {
  var _a
  const {config, extensions} = cache
  const {mutation: mutationKey, onCompleted, onSuccess, onError} = options
  validateStoreHooks(extensions)
  const {useStore, useExternalStore, useSelector} = extensions.react.storeHooks
  const innerStore = useStore()
  const externalStore = useExternalStore()
  const mutate = useCallback(
    (params) =>
      __awaiter(void 0, void 0, void 0, function* () {
        return mutateImpl(
          'useMutation.mutate',
          innerStore,
          externalStore,
          cache,
          mutationKey,
          params,
          onCompleted,
          onSuccess,
          onError,
        )
      }),
    [mutationKey, innerStore, externalStore, onCompleted, onSuccess, onError],
  )
  const [mutationStateSelector, abort] = useMemo(() => {
    const mutationStateSelectorFromUseMutation = (state) =>
      cache.selectors.selectMutationState(state, mutationKey)
    const abortFromUseMutation = () => {
      var _a
      const abortController =
        (_a = cache.abortControllers.get(innerStore)) === null || _a === void 0 ? void 0 : _a[mutationKey]
      if (abortController === undefined || abortController.signal.aborted) {
        return false
      }
      abortController.abort()
      innerStore.dispatch(cache.actions.updateMutationStateAndEntities(mutationKey, {loading: undefined}))
      return true
    }
    return [mutationStateSelectorFromUseMutation, abortFromUseMutation]
  }, [mutationKey, innerStore])
  const mutationState =
    (_a = useSelector(mutationStateSelector)) !== null && _a !== void 0 ? _a : EMPTY_OBJECT
  config.options.logsEnabled && logDebug('useMutation', {options, mutationState})
  return [mutate, mutationState, abort]
}
