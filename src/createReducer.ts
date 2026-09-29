import type {Actions} from './createActions'
import type {CacheOptions, CacheState, MutationState, QueryState, Typenames} from './types'
import {
  applyEntityChanges,
  EMPTY_OBJECT,
  incrementChangeKey,
  isEmptyObject,
  logDebug,
  optionalUtils,
} from './utilsAndConstants'

const optionalQueryKeys: (keyof QueryState<Typenames, unknown, unknown>)[] = [
  'error',
  'expiresAt',
  'result',
  'params',
  'loading',
]

const optionalMutationKeys: (keyof MutationState<Typenames, unknown, unknown>)[] = [
  'error',
  'result',
  'params',
  'loading',
]

export const createReducer = <N extends string, T extends Typenames, QP, QR, MP, MR>(
  actions: Actions<N, T, QP, QR, MP, MR>,
  queryKeys: (keyof (QP | QR))[],
  cacheOptions: CacheOptions,
) => {
  type TypedCacheState = CacheState<T, QP, QR, MP, MR>

  const mutable = cacheOptions.mutableCollections

  cacheOptions.logsEnabled &&
    logDebug('createReducer', {
      queryKeys,
      mutable,
    })

  const getMutableInitialState = mutable
    ? (): TypedCacheState => {
        return {
          entities: {} as TypedCacheState['entities'],
          queries: queryKeys.reduce(
            (result, x) => {
              result[x] = {} as TypedCacheState['queries'][keyof (QP | QR)]
              return result
            },
            {} as TypedCacheState['queries'],
          ),
          mutations: {} as TypedCacheState['mutations'],
        }
      }
    : undefined

  const immutableInitialState = mutable
    ? undefined
    : (Object.freeze({
        entities: Object.freeze({}),
        queries: Object.freeze(
          queryKeys.reduce(
            (result, x) => {
              result[x] = Object.freeze({}) as TypedCacheState['queries'][keyof (QP | QR)]
              return result
            },
            {} as TypedCacheState['queries'],
          ),
        ),
        mutations: Object.freeze({}),
      }) as TypedCacheState)

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

  return (
    state = mutable ? getMutableInitialState!() : immutableInitialState!,
    action: ReturnType<(typeof actions)[keyof typeof actions]>,
  ): TypedCacheState => {
    switch (action.type) {
      case updateQueryStateAndEntities.type: {
        const {
          queryKey,
          queryCacheKey,
          state: queryState,
          entityChanges,
        } = action as ReturnType<typeof updateQueryStateAndEntities>

        const oldQueryState = state.queries[queryKey][queryCacheKey]
        let newQueryState = queryState && {
          ...oldQueryState,
          ...queryState,
        }

        if (newQueryState) {
          if (oldQueryState && deepEqual) {
            // set back params if deeply same value
            if (
              newQueryState.params !== oldQueryState.params &&
              deepEqual(newQueryState.params, oldQueryState.params)
            ) {
              newQueryState.params = oldQueryState.params
            }

            // set back if deeply same value
            if (
              newQueryState.result !== oldQueryState.result &&
              deepEqual(newQueryState.result, oldQueryState.result)
            ) {
              newQueryState.result = oldQueryState.result
            }
          }

          // remove undefined optional fields
          for (const key of optionalQueryKeys) {
            if (key in newQueryState && newQueryState[key] === undefined) {
              delete newQueryState[key]
            }
          }

          // skip if new state deep equals to the old state
          if (deepEqual?.(oldQueryState ?? EMPTY_OBJECT, newQueryState)) {
            newQueryState = undefined
          }
        }

        const newEntities = entityChanges && applyEntityChanges(state.entities, entityChanges, cacheOptions)

        let newState
        if (newEntities) {
          newState ??= {...state}
          newState.entities = newEntities
        }

        if (newQueryState) {
          if (!isEmptyObject(newQueryState)) {
            newState ??= {...state}
            if (mutable) {
              // @ts-expect-error fix later
              newState.queries[queryKey][queryCacheKey] = newQueryState
              incrementChangeKey(newState.queries)
              incrementChangeKey(newState.queries[queryKey])
            } else {
              newState.queries = {
                ...state.queries,
                [queryKey]: {
                  ...state.queries[queryKey],
                  [queryCacheKey]: newQueryState,
                },
              }
            }
          } else if (oldQueryState !== undefined) {
            // empty states are removed
            newState ??= {...state}
            if (mutable) {
              delete newState.queries[queryKey][queryCacheKey]
              incrementChangeKey(newState.queries)
              incrementChangeKey(newState.queries[queryKey])
            } else {
              const {[queryCacheKey]: _, ...withoutCacheKey} = state.queries[queryKey]
              newState.queries = {...state.queries, [queryKey]: withoutCacheKey}
            }
          }
        }

        return newState ?? state
      }
      case updateMutationStateAndEntities.type: {
        const {
          mutationKey,
          state: mutationState,
          entityChanges,
        } = action as ReturnType<typeof updateMutationStateAndEntities>

        const oldMutationState = state.mutations[mutationKey]
        let newMutationState = mutationState && {
          ...oldMutationState,
          ...mutationState,
        }

        if (newMutationState) {
          if (oldMutationState && deepEqual) {
            // keep prev params if deeply same value
            if (
              newMutationState.params !== oldMutationState.params &&
              deepEqual(newMutationState.params, oldMutationState.params)
            ) {
              newMutationState.params = oldMutationState.params
            }

            // keep prev result if deeply same value
            if (
              newMutationState.result !== oldMutationState.result &&
              deepEqual(newMutationState.result, oldMutationState.result)
            ) {
              newMutationState.result = oldMutationState.result
            }
          }

          // remove optional fields with default values
          for (const key of optionalMutationKeys) {
            if (key in newMutationState && newMutationState[key] === undefined) {
              delete newMutationState[key]
            }
          }

          // skip if new state deep equals to the old state
          if (deepEqual?.(oldMutationState ?? EMPTY_OBJECT, newMutationState)) {
            newMutationState = undefined
          }
        }

        const newEntities = entityChanges && applyEntityChanges(state.entities, entityChanges, cacheOptions)

        let newState
        if (newEntities) {
          newState = {...state, entities: newEntities}
        }
        if (newMutationState) {
          if (!isEmptyObject(newMutationState)) {
            newState ??= {...state}

            if (mutable) {
              state.mutations[mutationKey] = newMutationState
              incrementChangeKey(state.mutations)
            } else {
              newState.mutations = {...state.mutations, [mutationKey]: newMutationState}
            }
          } else if (oldMutationState !== undefined) {
            newState ??= {...state}

            if (mutable) {
              delete state.mutations[mutationKey]
              incrementChangeKey(state.mutations)
            } else {
              // empty states are removed
              const {[mutationKey]: _, ...withoutMutationKey} = state.mutations
              newState.mutations = withoutMutationKey as typeof state.mutations
            }
          }
        }

        return newState ?? state
      }
      case mergeEntityChanges.type: {
        const {changes} = action as ReturnType<typeof mergeEntityChanges>

        const newEntities = applyEntityChanges(state.entities, changes, cacheOptions)

        return newEntities ? {...state, entities: newEntities} : state
      }
      case invalidateQuery.type: {
        const {queries: queriesToInvalidate} = action as ReturnType<typeof invalidateQuery>
        if (queriesToInvalidate.length === 0) {
          return state
        }

        const now = Date.now()
        let newStatesByQueryKey: typeof state.queries | undefined
        const copiedQueryKeys = mutable ? undefined : new Set<keyof typeof state.queries>() // Used in immutable mode to create new states by queryKey only once.

        for (const {query: queryKey, cacheKey, expiresAt = now} of queriesToInvalidate) {
          const statesByCacheKey = (newStatesByQueryKey ?? state.queries)[queryKey]
          const cacheKeysToInvalidate: (keyof typeof statesByCacheKey)[] =
            cacheKey != null ? [cacheKey] : Reflect.ownKeys(statesByCacheKey) // Reflect.ownKeys supports symbols

          for (const cacheKey of cacheKeysToInvalidate) {
            if (mutable && cacheKey === '_changeKey') {
              continue
            }

            const queryState = statesByCacheKey[cacheKey]
            if (!queryState || queryState.expiresAt === expiresAt) {
              continue
            }

            if (mutable) {
              newStatesByQueryKey ??= state.queries
              incrementChangeKey(newStatesByQueryKey[queryKey])
            } else {
              newStatesByQueryKey ??= {...state.queries}
              if (!copiedQueryKeys!.has(queryKey)) {
                newStatesByQueryKey[queryKey] = {...newStatesByQueryKey[queryKey]}
                copiedQueryKeys!.add(queryKey)
              }
            }

            if (expiresAt !== undefined) {
              newStatesByQueryKey[queryKey][cacheKey] = {...queryState, expiresAt}
            } else {
              const {expiresAt: _, ...newQueryState} = queryState
              if (isEmptyObject(newQueryState)) {
                delete newStatesByQueryKey[queryKey][cacheKey]
              } else {
                // @ts-expect-error fix later
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
        return {
          ...state,
          queries: newStatesByQueryKey,
        }
      }
      case clearQueryState.type: {
        const {queries: queriesToClear} = action as ReturnType<typeof clearQueryState>
        if (queriesToClear.length === 0) {
          return state
        }

        let newStatesByQueryKey: typeof state.queries | undefined
        const copiedQueryKeys = mutable ? undefined : new Set<keyof typeof state.queries>() // Used in immutable mode to create new states by queryKey only once.

        for (const {query: queryKey, cacheKey} of queriesToClear) {
          const statesByCacheKey = (newStatesByQueryKey ?? state.queries)[queryKey]

          // Clearing state for provided query key + cache key

          if (cacheKey != null) {
            if (!statesByCacheKey[cacheKey]) {
              continue
            }

            if (mutable) {
              newStatesByQueryKey ??= state.queries
              incrementChangeKey(newStatesByQueryKey[queryKey])
            } else {
              newStatesByQueryKey ??= {...state.queries}
              if (!copiedQueryKeys!.has(queryKey)) {
                newStatesByQueryKey[queryKey] = {...newStatesByQueryKey[queryKey]}
                copiedQueryKeys!.add(queryKey)
              }
            }
            delete newStatesByQueryKey[queryKey][cacheKey]

            // Clearing all states for provided query key
            //
          } else if (mutable) {
            newStatesByQueryKey ??= state.queries
            // @ts-expect-error fix later
            newStatesByQueryKey[queryKey] = {}
          } else if (statesByCacheKey !== EMPTY_OBJECT) {
            newStatesByQueryKey ??= {...state.queries}
            // @ts-expect-error fix later
            newStatesByQueryKey[queryKey] = EMPTY_OBJECT
            copiedQueryKeys!.add(queryKey)
          }
        }

        if (newStatesByQueryKey === undefined) {
          return state
        }

        if (mutable) {
          incrementChangeKey(newStatesByQueryKey)
        }
        return {
          ...state,
          queries: newStatesByQueryKey,
        }
      }
      case clearMutationState.type: {
        const {mutationKeys} = action as ReturnType<typeof clearMutationState>

        if (mutationKeys.length === 0) {
          return state
        }

        let newMutations = undefined

        for (const mutation of mutationKeys) {
          if (state.mutations[mutation]) {
            newMutations ??= mutable ? state.mutations : {...state.mutations}
            delete newMutations[mutation]
          }
        }

        if (newMutations === undefined) {
          return state
        }

        if (mutable) {
          incrementChangeKey(newMutations)
        }
        return {
          ...state,
          mutations: newMutations,
        }
      }
      case clearCache.type: {
        const {stateToKeep} = action as ReturnType<typeof clearCache>
        const initialState = mutable ? getMutableInitialState!() : immutableInitialState!
        return stateToKeep
          ? {
              ...initialState,
              ...stateToKeep,
            }
          : initialState
      }
    }
    return state
  }
}
