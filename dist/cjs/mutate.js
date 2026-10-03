'use strict'
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
Object.defineProperty(exports, '__esModule', {value: true})
exports.mutate = void 0
const utilsAndConstants_1 = require('./utilsAndConstants')
const mutate = (logTag_1, innerStore_1, externalStore_1, _a, mutationKey_1, params_1, ...args_1) =>
  __awaiter(
    void 0,
    [logTag_1, innerStore_1, externalStore_1, _a, mutationKey_1, params_1, ...args_1],
    void 0,
    function* (
      logTag,
      innerStore,
      externalStore,
      {config: {mutations, options, globals}, actions: {updateMutationStateAndEntities}, abortControllers},
      mutationKey,
      params,
      onCompleted = mutations[mutationKey].onCompleted,
      onSuccess = mutations[mutationKey].onSuccess,
      onError = mutations[mutationKey].onError,
    ) {
      var _b
      let abortControllersOfStore = abortControllers.get(innerStore)
      if (abortControllersOfStore === undefined) {
        abortControllersOfStore = {}
        abortControllers.set(innerStore, abortControllersOfStore)
      }
      {
        const abortController = abortControllersOfStore[mutationKey]
        options.logsEnabled &&
          (0, utilsAndConstants_1.logDebug)(logTag, {
            mutationKey,
            params,
            previousAborted: abortController !== undefined,
          })
        if (abortController !== undefined) {
          abortController.abort()
        }
      }
      const abortController = new AbortController()
      abortControllersOfStore[mutationKey] = abortController
      let mutatePromise
      let response
      let error
      try {
        mutatePromise = mutations[mutationKey].mutation(params, externalStore, abortController.signal)
      } catch (e) {
        error = e
      }
      if (!error) {
        innerStore.dispatch(
          updateMutationStateAndEntities(mutationKey, {
            loading: mutatePromise,
            params,
            result: undefined,
            error,
          }),
        )
        try {
          response = yield mutatePromise
        } catch (e) {
          error = e
        }
      }
      options.logsEnabled &&
        (0, utilsAndConstants_1.logDebug)(`${logTag} finished`, {
          response,
          error,
          aborted: abortController.signal.aborted,
        })
      if (abortController.signal.aborted) {
        return ABORTED_RESULT
      }
      delete abortControllersOfStore[mutationKey]
      if (error) {
        innerStore.dispatch(
          updateMutationStateAndEntities(mutationKey, {
            params,
            error,
            loading: undefined,
          }),
        )
        if (!(onError === null || onError === void 0 ? void 0 : onError(error, params, externalStore))) {
          ;(_b = globals.onError) === null || _b === void 0
            ? void 0
            : _b.call(globals, error, mutationKey, params, externalStore)
        }
        onCompleted === null || onCompleted === void 0
          ? void 0
          : onCompleted(response, error, params, externalStore)
        return {error}
      }
      if (response) {
        const newState = {
          error: undefined,
          loading: undefined,
          result: response.result,
        }
        innerStore.dispatch(updateMutationStateAndEntities(mutationKey, newState, response))
        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(response, params, externalStore)
        onCompleted === null || onCompleted === void 0
          ? void 0
          : onCompleted(response, error, params, externalStore)
        return {result: response.result}
      }
      throw new Error(`${logTag}: both error and response are not defined`)
    },
  )
exports.mutate = mutate
const ABORTED_RESULT = Object.freeze({aborted: true})
