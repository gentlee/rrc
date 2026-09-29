import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    actions: {clearQueryState, invalidateQuery, updateQueryStateAndEntities},
  } = cache

  test('should work with and without cache key', () => {
    const store = createReduxStore(cache)

    store.dispatch(updateQueryStateAndEntities('getUser', 0, {result: 0}))
    store.dispatch(updateQueryStateAndEntities('getUser', 1, {result: 1}))
    store.dispatch(updateQueryStateAndEntities('getUser', 2, {result: 2}))

    // invalidate two cache keys

    const now = Date.now()
    store.dispatch(
      invalidateQuery([
        {query: 'getUser', cacheKey: 0},
        {query: 'getUser', cacheKey: 0},
        {query: 'getUser', cacheKey: 1, expiresAt: now + 1000},
      ]),
    )
    expect(store.getState().cache.queries.getUser).toStrictEqual(
      withChangeKey(4, {
        0: {result: 0, expiresAt: expect.any(Number)},
        1: {result: 1, expiresAt: now + 1000},
        2: {result: 2},
      }),
    )

    // invalidate all cache keys

    store.dispatch(invalidateQuery([{query: 'getUser'}]))

    const getUserStates = store.getState().cache.queries.getUser
    expect(getUserStates[0]!.expiresAt).toBe(getUserStates[1]!.expiresAt)
    expect(getUserStates[1]!.expiresAt).toBe(getUserStates[2]!.expiresAt)
    expect(typeof getUserStates[2]!.expiresAt).toBe('number')
  })

  test('bulk invalidation updates change keys and preserves states with matching expiresAt', () => {
    const store = createReduxStore(cache)
    const now = Date.now()

    store.dispatch(updateQueryStateAndEntities('getUser', 0, {result: 0, expiresAt: now}))
    store.dispatch(updateQueryStateAndEntities('getUser', 1, {result: 1, expiresAt: now + 1000}))
    store.dispatch(updateQueryStateAndEntities('getUser', 2, {result: 2}))

    const unchangedQueryState = store.getState().cache.queries.getUser[0]
    const changedQueryState = store.getState().cache.queries.getUser[1]

    store.dispatch(invalidateQuery([{query: 'getUser'}]))

    expect(store.getState().cache.queries.getUser).toStrictEqual(
      withChangeKey(4, {
        0: {result: 0, expiresAt: now},
        1: {result: 1, expiresAt: now},
        2: {result: 2, expiresAt: now},
      }),
    )
    expect(store.getState().cache.queries.getUser[0]).toBe(unchangedQueryState)
    expect(store.getState().cache.queries.getUser[1]).not.toBe(changedQueryState)
    expect(changedQueryState).toStrictEqual({result: 1, expiresAt: now + 1000})

    const state = store.getState()
    store.dispatch(invalidateQuery([{query: 'getUser'}]))
    expect(store.getState()).toBe(state)
  })

  test.each([false, true])('invalidates symbol cache keys with bulk=%s', (bulk) => {
    const store = createReduxStore(cache)
    const cacheKey = Symbol('user')
    const now = Date.now()

    store.dispatch(updateQueryStateAndEntities('getUser', cacheKey, {result: 0, expiresAt: now + 1000}))
    store.dispatch(invalidateQuery([{query: 'getUser', ...(bulk ? null : {cacheKey})}]))

    expect(store.getState().cache.queries.getUser).toStrictEqual(
      withChangeKey(1, {[cacheKey]: {result: 0, expiresAt: now}}),
    )
  })

  test('does not invalidate a collection containing only change key', () => {
    const store = createReduxStore(cache)

    store.dispatch(updateQueryStateAndEntities('getUser', 0, {result: 0}))
    store.dispatch(clearQueryState([{query: 'getUser', cacheKey: 0}]))
    const state = store.getState()
    expect(state.cache.queries.getUser).toStrictEqual(withChangeKey(1, {}))

    store.dispatch(invalidateQuery([{query: 'getUser'}]))
    expect(store.getState()).toBe(state)
  })

  test('should work if cache key missing', () => {
    const store = createReduxStore(cache)

    store.dispatch(
      invalidateQuery([
        {query: 'getUser'},
        {query: 'getUser', cacheKey: 0},
        {query: 'getUser', cacheKey: 0},
        {query: 'getUser', cacheKey: 2},
        {query: 'getUser'},
        {query: 'getUser', cacheKey: 0},
      ]),
    )

    store.dispatch(
      updateQueryStateAndEntities('getUser', 0, {
        result: 0,
      }),
    )
    store.dispatch(
      invalidateQuery([
        {query: 'getUser', cacheKey: 1},
        {query: 'getUser', cacheKey: 2},
      ]),
    )

    expect(store.getState().cache.queries.getUser).toStrictEqual(withChangeKey(0, {0: {result: 0}}))
  })
})
