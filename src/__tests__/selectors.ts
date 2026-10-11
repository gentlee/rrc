import {generateTestEntitiesMap, generateTestUser} from '../testing/api/utils'
import {testCaches} from '../testing/redux/cache'
import {createReduxStore} from '../testing/redux/store'
import {EMPTY_OBJECT} from '../utilsAndConstants'

describe.each(testCaches)('%s selectors', (_, cache) => {
  const {
    actions: {mergeEntityChanges, updateMutationStateAndEntities, updateQueryStateAndEntities},
    selectors: {
      selectCacheState,
      selectEntities,
      selectEntitiesByTypename,
      selectEntityById,
      selectMutationError,
      selectMutationLoading,
      selectMutationParams,
      selectMutationResult,
      selectMutationState,
      selectQueryError,
      selectQueryExpiresAt,
      selectQueryLoading,
      selectQueryParams,
      selectQueryResult,
      selectQueryState,
    },
  } = cache

  test('empty state', () => {
    const state = createReduxStore(cache).getState()

    expect(selectCacheState(state)).toBe(state.cache)
    expect(selectEntities(state)).toBe(state.cache.entities)
    expect(selectEntitiesByTypename(state, 'users')).toBeUndefined()
    expect(selectEntityById(state, 0, 'users')).toBeUndefined()

    expect(selectQueryState(state, 'getUser', 0)).toBe(EMPTY_OBJECT)
    expect(selectQueryResult(state, 'getUser', 0)).toBeUndefined()
    expect(selectQueryLoading(state, 'getUser', 0)).toBe(false)
    expect(selectQueryError(state, 'getUser', 0)).toBeUndefined()
    expect(selectQueryParams(state, 'getUser', 0)).toBeUndefined()
    expect(selectQueryExpiresAt(state, 'getUser', 0)).toBeUndefined()

    expect(selectMutationState(state, 'updateUser')).toBe(EMPTY_OBJECT)
    expect(selectMutationResult(state, 'updateUser')).toBeUndefined()
    expect(selectMutationLoading(state, 'updateUser')).toBe(false)
    expect(selectMutationError(state, 'updateUser')).toBeUndefined()
    expect(selectMutationParams(state, 'updateUser')).toBeUndefined()
  })

  test('filled state', () => {
    const store = createReduxStore(cache)
    const loading = new Promise<never>(() => {})
    const error = new Error('test')
    const params = {id: 0, name: 'name'}
    store.dispatch(mergeEntityChanges({merge: generateTestEntitiesMap(1)}))
    store.dispatch(
      updateQueryStateAndEntities('getUser', 0, {result: 0, params: 0, loading, error, expiresAt: 100}),
    )
    store.dispatch(updateMutationStateAndEntities('updateUser', {result: 0, params, loading, error}))
    const state = store.getState()

    expect(selectEntitiesByTypename(state, 'users')).toBe(state.cache.entities.users)
    expect(selectEntityById(state, 0, 'users')).toStrictEqual(generateTestUser(0))
    expect(selectEntityById(state, 1, 'users')).toBeUndefined()

    expect(selectQueryState(state, 'getUser', 0)).toBe(state.cache.queries.getUser[0])
    expect(selectQueryResult(state, 'getUser', 0)).toBe(0)
    expect(selectQueryLoading(state, 'getUser', 0)).toBe(loading)
    expect(selectQueryError(state, 'getUser', 0)).toBe(error)
    expect(selectQueryParams(state, 'getUser', 0)).toBe(0)
    expect(selectQueryExpiresAt(state, 'getUser', 0)).toBe(100)

    expect(selectMutationState(state, 'updateUser')).toBe(state.cache.mutations.updateUser)
    expect(selectMutationResult(state, 'updateUser')).toBe(0)
    expect(selectMutationLoading(state, 'updateUser')).toBe(loading)
    expect(selectMutationError(state, 'updateUser')).toBe(error)
    expect(selectMutationParams(state, 'updateUser')).toBe(params)
  })

  test.each([null, undefined])('selectEntityById returns undefined for %s id', (id) => {
    const store = createReduxStore(cache)
    store.dispatch(mergeEntityChanges({merge: generateTestEntitiesMap(1)}))

    expect(selectEntityById(store.getState(), id, 'users')).toBeUndefined()
  })
})
