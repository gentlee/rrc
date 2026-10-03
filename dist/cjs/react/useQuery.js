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
exports.useQuery = void 0
const react_1 = require('react')
const query_1 = require('../query')
const utilsAndConstants_1 = require('../utilsAndConstants')
const utils_1 = require('./utils')
const useQuery = (cache, useQueryOptions) => {
  var _a, _b, _c, _d, _e, _f, _g
  const {
    extensions,
    config: {queries, globals, options: configOptions},
    selectors: {selectQueryState},
  } = cache
  const {
    query: queryKey,
    skipFetch = (_b =
      (_a = queries[queryKey].skipFetch) !== null && _a !== void 0 ? _a : globals.queries.skipFetch) !==
      null && _b !== void 0
      ? _b
      : false,
    params,
    selectorComparer,
    secondsToLive,
    mergeResults,
    onCompleted,
    onSuccess,
    onError,
    fetchPolicy = (_c = queries[queryKey].fetchPolicy) !== null && _c !== void 0
      ? _c
      : globals.queries.fetchPolicy,
  } = useQueryOptions
  ;(0, utils_1.validateStoreHooks)(extensions)
  const {useStore, useSelector, useExternalStore} = extensions.react.storeHooks
  const innerStore = useStore()
  const externalStore = useExternalStore()
  const queryInfo = queries[queryKey]
  const logsEnabled = configOptions.logsEnabled
  const getCacheKey =
    (_d = queryInfo.getCacheKey) !== null && _d !== void 0 ? _d : utilsAndConstants_1.defaultGetCacheKey
  const comparer =
    selectorComparer === undefined
      ? (_f =
          (_e = queryInfo.selectorComparer) !== null && _e !== void 0
            ? _e
            : globals.queries.selectorComparer) !== null && _f !== void 0
        ? _f
        : defaultStateComparer
      : typeof selectorComparer === 'function'
        ? selectorComparer
        : (0, utilsAndConstants_1.createStateComparer)(selectorComparer)
  const cacheKey = getCacheKey(params)
  const query = (0, react_1.useCallback)(
    (options) =>
      __awaiter(void 0, void 0, void 0, function* () {
        const paramsPassed = options && 'params' in options
        return yield (0, query_1.query)(
          'useQuery.query',
          innerStore,
          externalStore,
          cache,
          queryKey,
          paramsPassed ? getCacheKey(options.params) : cacheKey,
          paramsPassed ? options.params : params,
          options === null || options === void 0 ? void 0 : options.onlyIfExpired,
          false,
          secondsToLive,
          mergeResults,
          onCompleted,
          onSuccess,
          onError,
        )
      }),
    [
      cache,
      queryKey,
      cacheKey,
      externalStore,
      secondsToLive,
      getCacheKey,
      mergeResults,
      onCompleted,
      onError,
      onSuccess,
    ],
  )
  const queryState =
    (_g = useSelector((state) => {
      return selectQueryState(state, queryKey, cacheKey)
    }, comparer)) !== null && _g !== void 0
      ? _g
      : utilsAndConstants_1.EMPTY_OBJECT
  ;(0, react_1.useEffect)(() => {
    if (skipFetch) {
      logsEnabled &&
        (0, utilsAndConstants_1.logDebug)('useQuery.useEffect skip fetch', {skipFetch, queryKey, cacheKey})
      return
    }
    const expired = queryState.expiresAt != null && queryState.expiresAt <= Date.now()
    if (!fetchPolicy(expired, params, queryState, externalStore)) {
      logsEnabled &&
        (0, utilsAndConstants_1.logDebug)('useQuery.useEffect skip fetch due to fetch policy', {
          queryState,
          expired,
          queryKey,
          cacheKey,
        })
      return
    }
    query()
  }, [queryKey, cacheKey, skipFetch, externalStore])
  logsEnabled &&
    (0, utilsAndConstants_1.logDebug)('useQuery', {cacheKey, options: useQueryOptions, queryState})
  return [queryState, query]
}
exports.useQuery = useQuery
const defaultStateComparer = (0, utilsAndConstants_1.createStateComparer)([
  'result',
  'loading',
  'params',
  'error',
])
