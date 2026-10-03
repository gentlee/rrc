var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {}
    for (var p in s) {
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) {
        t[p] = s[p]
      }
    }
    if (s != null && typeof Object.getOwnPropertySymbols === 'function') {
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) {
          t[p[i]] = s[p[i]]
        }
      }
    }
    return t
  }
import {
  applyEntityChanges,
  EMPTY_OBJECT,
  incrementChangeKey,
  isEmptyObject,
  logDebug,
  optionalUtils,
} from './utilsAndConstants'
const optionalQueryKeys = ['error', 'expiresAt', 'result', 'params', 'loading']
const optionalMutationKeys = ['error', 'result', 'params', 'loading']

export const createReducer = (actions, queryKeys, cacheOptions) => {
  const mutable = cacheOptions.mutableCollections
  cacheOptions.logsEnabled &&
    logDebug('createReducer', {
      queryKeys,
      mutable,
    })
  const getMutableInitialState = mutable
    ? () => {
        return {
          entities: {},
          queries: queryKeys.reduce((result, x) => {
            result[x] = {}
            return result
          }, {}),
          mutations: {},
        }
      }
    : undefined
  const immutableInitialState = mutable
    ? undefined
    : Object.freeze({
        entities: Object.freeze({}),
        queries: Object.freeze(
          queryKeys.reduce((result, x) => {
            result[x] = Object.freeze({})
            return result
          }, {}),
        ),
        mutations: Object.freeze({}),
      })
  const {
    clearCache,
    clearMutationState,
    clearQueryState,
    invalidateQuery,
    mergeEntityChanges,
    updateMutationStateAndEntities,
    updateQueryStateAndEntities,
  } = actions
  const deepEqual = cacheOptions.deepComparisonEnabled ? optionalUtils.deepEqual : undefined
  return (state = mutable ? getMutableInitialState() : immutableInitialState, action) => {
    switch (action.type) {
      case updateQueryStateAndEntities.type: {
        const {queryKey, queryCacheKey, state: queryState, entityChanges} = action
        const oldQueryState = state.queries[queryKey][queryCacheKey]
        let newQueryState = queryState && Object.assign(Object.assign({}, oldQueryState), queryState)
        if (newQueryState) {
          if (oldQueryState && deepEqual) {
            if (
              newQueryState.params !== oldQueryState.params &&
              deepEqual(newQueryState.params, oldQueryState.params)
            ) {
              newQueryState.params = oldQueryState.params
            }
            if (
              newQueryState.result !== oldQueryState.result &&
              deepEqual(newQueryState.result, oldQueryState.result)
            ) {
              newQueryState.result = oldQueryState.result
            }
          }
          for (const key of optionalQueryKeys) {
            if (key in newQueryState && newQueryState[key] === undefined) {
              delete newQueryState[key]
            }
          }
          if (
            deepEqual === null || deepEqual === void 0
              ? void 0
              : deepEqual(
                  oldQueryState !== null && oldQueryState !== void 0 ? oldQueryState : EMPTY_OBJECT,
                  newQueryState,
                )
          ) {
            newQueryState = undefined
          }
        }
        const newEntities = entityChanges && applyEntityChanges(state.entities, entityChanges, cacheOptions)
        let newState
        if (newEntities) {
          newState !== null && newState !== void 0 ? newState : (newState = Object.assign({}, state))
          newState.entities = newEntities
        }
        if (newQueryState) {
          if (!isEmptyObject(newQueryState)) {
            newState !== null && newState !== void 0 ? newState : (newState = Object.assign({}, state))
            if (mutable) {
              newState.queries[queryKey][queryCacheKey] = newQueryState
              incrementChangeKey(newState.queries)
              incrementChangeKey(newState.queries[queryKey])
            } else {
              newState.queries = Object.assign(Object.assign({}, state.queries), {
                [queryKey]: Object.assign(Object.assign({}, state.queries[queryKey]), {
                  [queryCacheKey]: newQueryState,
                }),
              })
            }
          } else if (oldQueryState !== undefined) {
            newState !== null && newState !== void 0 ? newState : (newState = Object.assign({}, state))
            if (mutable) {
              delete newState.queries[queryKey][queryCacheKey]
              incrementChangeKey(newState.queries)
              incrementChangeKey(newState.queries[queryKey])
            } else {
              const _a = state.queries[queryKey],
                _b = queryCacheKey,
                _ = _a[_b],
                withoutCacheKey = __rest(_a, [typeof _b === 'symbol' ? _b : _b + ''])
              newState.queries = Object.assign(Object.assign({}, state.queries), {
                [queryKey]: withoutCacheKey,
              })
            }
          }
        }
        return newState !== null && newState !== void 0 ? newState : state
      }
      case updateMutationStateAndEntities.type: {
        const {mutationKey, state: mutationState, entityChanges} = action
        const oldMutationState = state.mutations[mutationKey]
        let newMutationState =
          mutationState && Object.assign(Object.assign({}, oldMutationState), mutationState)
        if (newMutationState) {
          if (oldMutationState && deepEqual) {
            if (
              newMutationState.params !== oldMutationState.params &&
              deepEqual(newMutationState.params, oldMutationState.params)
            ) {
              newMutationState.params = oldMutationState.params
            }
            if (
              newMutationState.result !== oldMutationState.result &&
              deepEqual(newMutationState.result, oldMutationState.result)
            ) {
              newMutationState.result = oldMutationState.result
            }
          }
          for (const key of optionalMutationKeys) {
            if (key in newMutationState && newMutationState[key] === undefined) {
              delete newMutationState[key]
            }
          }
          if (
            deepEqual === null || deepEqual === void 0
              ? void 0
              : deepEqual(
                  oldMutationState !== null && oldMutationState !== void 0 ? oldMutationState : EMPTY_OBJECT,
                  newMutationState,
                )
          ) {
            newMutationState = undefined
          }
        }
        const newEntities = entityChanges && applyEntityChanges(state.entities, entityChanges, cacheOptions)
        let newState
        if (newEntities) {
          newState = Object.assign(Object.assign({}, state), {entities: newEntities})
        }
        if (newMutationState) {
          if (!isEmptyObject(newMutationState)) {
            newState !== null && newState !== void 0 ? newState : (newState = Object.assign({}, state))
            if (mutable) {
              state.mutations[mutationKey] = newMutationState
              incrementChangeKey(state.mutations)
            } else {
              newState.mutations = Object.assign(Object.assign({}, state.mutations), {
                [mutationKey]: newMutationState,
              })
            }
          } else if (oldMutationState !== undefined) {
            newState !== null && newState !== void 0 ? newState : (newState = Object.assign({}, state))
            if (mutable) {
              delete state.mutations[mutationKey]
              incrementChangeKey(state.mutations)
            } else {
              const _c = state.mutations,
                _d = mutationKey,
                _ = _c[_d],
                withoutMutationKey = __rest(_c, [typeof _d === 'symbol' ? _d : _d + ''])
              newState.mutations = withoutMutationKey
            }
          }
        }
        return newState !== null && newState !== void 0 ? newState : state
      }
      case mergeEntityChanges.type: {
        const {changes} = action
        const newEntities = applyEntityChanges(state.entities, changes, cacheOptions)
        return newEntities ? Object.assign(Object.assign({}, state), {entities: newEntities}) : state
      }
      case invalidateQuery.type: {
        const {queries: queriesToInvalidate} = action
        if (queriesToInvalidate.length === 0) {
          return state
        }
        const now = Date.now()
        let newStatesByQueryKey
        const copiedQueryKeys = mutable ? undefined : new Set()
        for (const {query: queryKey, cacheKey, expiresAt = now} of queriesToInvalidate) {
          const statesByCacheKey = (
            newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
              ? newStatesByQueryKey
              : state.queries
          )[queryKey]
          const cacheKeysToInvalidate = cacheKey != null ? [cacheKey] : Reflect.ownKeys(statesByCacheKey)
          for (const cacheKey of cacheKeysToInvalidate) {
            if (mutable && cacheKey === '_changeKey') {
              continue
            }
            const queryState = statesByCacheKey[cacheKey]
            if (!queryState || queryState.expiresAt === expiresAt) {
              continue
            }
            if (mutable) {
              newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
                ? newStatesByQueryKey
                : (newStatesByQueryKey = state.queries)
              incrementChangeKey(newStatesByQueryKey[queryKey])
            } else {
              newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
                ? newStatesByQueryKey
                : (newStatesByQueryKey = Object.assign({}, state.queries))
              if (!copiedQueryKeys.has(queryKey)) {
                newStatesByQueryKey[queryKey] = Object.assign({}, newStatesByQueryKey[queryKey])
                copiedQueryKeys.add(queryKey)
              }
            }
            if (expiresAt !== undefined) {
              newStatesByQueryKey[queryKey][cacheKey] = Object.assign(Object.assign({}, queryState), {
                expiresAt,
              })
            } else {
              const {expiresAt: _} = queryState,
                newQueryState = __rest(queryState, ['expiresAt'])
              if (isEmptyObject(newQueryState)) {
                delete newStatesByQueryKey[queryKey][cacheKey]
              } else {
                newStatesByQueryKey[queryKey][cacheKey] = newQueryState
              }
            }
          }
        }
        if (!newStatesByQueryKey) {
          return state
        }
        if (mutable) {
          incrementChangeKey(newStatesByQueryKey)
        }
        return Object.assign(Object.assign({}, state), {queries: newStatesByQueryKey})
      }
      case clearQueryState.type: {
        const {queries: queriesToClear} = action
        if (queriesToClear.length === 0) {
          return state
        }
        let newStatesByQueryKey
        const copiedQueryKeys = mutable ? undefined : new Set()
        for (const {query: queryKey, cacheKey} of queriesToClear) {
          const statesByCacheKey = (
            newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
              ? newStatesByQueryKey
              : state.queries
          )[queryKey]
          if (cacheKey != null) {
            if (!statesByCacheKey[cacheKey]) {
              continue
            }
            if (mutable) {
              newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
                ? newStatesByQueryKey
                : (newStatesByQueryKey = state.queries)
              incrementChangeKey(newStatesByQueryKey[queryKey])
            } else {
              newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
                ? newStatesByQueryKey
                : (newStatesByQueryKey = Object.assign({}, state.queries))
              if (!copiedQueryKeys.has(queryKey)) {
                newStatesByQueryKey[queryKey] = Object.assign({}, newStatesByQueryKey[queryKey])
                copiedQueryKeys.add(queryKey)
              }
            }
            delete newStatesByQueryKey[queryKey][cacheKey]
          } else if (mutable) {
            newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
              ? newStatesByQueryKey
              : (newStatesByQueryKey = state.queries)
            newStatesByQueryKey[queryKey] = {}
          } else if (statesByCacheKey !== EMPTY_OBJECT) {
            newStatesByQueryKey !== null && newStatesByQueryKey !== void 0
              ? newStatesByQueryKey
              : (newStatesByQueryKey = Object.assign({}, state.queries))
            newStatesByQueryKey[queryKey] = EMPTY_OBJECT
            copiedQueryKeys.add(queryKey)
          }
        }
        if (newStatesByQueryKey === undefined) {
          return state
        }
        if (mutable) {
          incrementChangeKey(newStatesByQueryKey)
        }
        return Object.assign(Object.assign({}, state), {queries: newStatesByQueryKey})
      }
      case clearMutationState.type: {
        const {mutationKeys} = action
        if (mutationKeys.length === 0) {
          return state
        }
        let newMutations = undefined
        for (const mutation of mutationKeys) {
          if (state.mutations[mutation]) {
            newMutations !== null && newMutations !== void 0
              ? newMutations
              : (newMutations = mutable ? state.mutations : Object.assign({}, state.mutations))
            delete newMutations[mutation]
          }
        }
        if (newMutations === undefined) {
          return state
        }
        if (mutable) {
          incrementChangeKey(newMutations)
        }
        return Object.assign(Object.assign({}, state), {mutations: newMutations})
      }
      case clearCache.type: {
        const {stateToKeep} = action
        const initialState = mutable ? getMutableInitialState() : immutableInitialState
        return stateToKeep ? Object.assign(Object.assign({}, initialState), stateToKeep) : initialState
      }
    }
    return state
  }
}
