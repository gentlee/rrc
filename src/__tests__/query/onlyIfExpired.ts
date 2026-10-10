import {bindAsyncActions} from '../../bindAsyncActions'
import {createCache} from '../../createCache'
import {initializeForRedux} from '../../redux'
import {createReduxStore} from '../../testing/redux/store'
import {CacheToPrivate} from '../../typesPrivate'
import {FetchPolicy} from '../../utilsAndConstants'

const NOW = 1_000_000

type TestFetchPolicy = (params: unknown, state: object, store: unknown) => boolean

describe.each([false, true])('onlyIfExpired (mutableCollections: %s)', (mutableCollections) => {
  const setup = (queryFetchPolicy?: TestFetchPolicy, globalFetchPolicy?: TestFetchPolicy) => {
    const request = jest.fn(async (_params: number) => ({result: 2}))
    const cache = createCache({
      name: 'cache',
      cacheStateKey: 'cache',
      options: {mutableCollections},
      globals: {queries: {fetchPolicy: globalFetchPolicy}},
      queries: {load: {query: request, fetchPolicy: queryFetchPolicy}},
    })
    const {reducer, actions} = initializeForRedux(cache)
    const store = createReduxStore({...cache, reducer})
    const client = bindAsyncActions(cache as CacheToPrivate<typeof cache>, store, store)
    return {cache, store, actions, client, request}
  }

  beforeEach(() => {
    jest.setSystemTime(NOW)
  })

  test.each([
    ['no cached result', undefined, undefined, true],
    ['no cached result, not expired', undefined, NOW + 1, true],
    ['cached result without expiresAt', 1, undefined, false],
    ['cached result, not expired', 1, NOW + 1, false],
    ['cached result, expires now', 1, NOW, true],
    ['cached result, expired', 1, NOW - 1, true],
  ])('%s', async (_, result, expiresAt, shouldFetch) => {
    const {cache, store, actions, client, request} = setup()
    if (result !== undefined || expiresAt !== undefined) {
      store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result, expiresAt}))
    }
    const stateOnStart = cache.selectors.selectQueryState(store.getState(), 'load', 1)

    const outcome = await client.query({query: 'load', params: 1, onlyIfExpired: true})

    expect(request).toHaveBeenCalledTimes(shouldFetch ? 1 : 0)
    expect(outcome).toEqual(shouldFetch ? {result: 2} : {cancelled: 'not-expired', result})

    // Default fetch policy is used when it is not set in the config.
    expect(FetchPolicy.NoCacheOrExpired(1, stateOnStart)).toBe(shouldFetch)
  })

  test('uses fetch policy of the query, passing params, state and store', async () => {
    const queryFetchPolicy = jest.fn<boolean, Parameters<TestFetchPolicy>>(() => false)
    const globalFetchPolicy = jest.fn<boolean, Parameters<TestFetchPolicy>>(() => true)
    const {cache, store, actions, client, request} = setup(queryFetchPolicy, globalFetchPolicy)
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 1, expiresAt: NOW - 1}))
    const stateOnStart = cache.selectors.selectQueryState(store.getState(), 'load', 1)

    // Expired, but policy of the query does not allow fetch.
    const outcome = await client.query({query: 'load', params: 1, onlyIfExpired: true})

    expect(outcome).toEqual({cancelled: 'not-expired', result: 1})
    expect(request).not.toHaveBeenCalled()
    expect(queryFetchPolicy).toHaveBeenCalledTimes(1)
    expect(queryFetchPolicy).toHaveBeenCalledWith(1, stateOnStart, store)
    expect(globalFetchPolicy).not.toHaveBeenCalled()
  })

  test('uses global fetch policy when the query does not have its own', async () => {
    const globalFetchPolicy = jest.fn<boolean, Parameters<TestFetchPolicy>>(() => false)
    const {store, actions, client, request} = setup(undefined, globalFetchPolicy)
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 1, expiresAt: NOW - 1}))

    const outcome = await client.query({query: 'load', params: 1, onlyIfExpired: true})

    expect(outcome).toEqual({cancelled: 'not-expired', result: 1})
    expect(request).not.toHaveBeenCalled()
    expect(globalFetchPolicy).toHaveBeenCalledTimes(1)
  })

  test('FetchPolicy.Always fetches even when result is cached and not expired', async () => {
    const {store, actions, client, request} = setup(FetchPolicy.Always)
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 1, expiresAt: NOW + 1}))

    expect(await client.query({query: 'load', params: 1, onlyIfExpired: true})).toEqual({result: 2})
    expect(request).toHaveBeenCalledTimes(1)
  })

  test('fetch policy is not called without onlyIfExpired', async () => {
    const queryFetchPolicy = jest.fn<boolean, Parameters<TestFetchPolicy>>(() => false)
    const {client, request} = setup(queryFetchPolicy)

    expect(await client.query({query: 'load', params: 1})).toEqual({result: 2})
    expect(request).toHaveBeenCalledTimes(1)
    expect(queryFetchPolicy).not.toHaveBeenCalled()
  })

  test('without onlyIfExpired always fetches', async () => {
    const {store, actions, client, request} = setup()
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 1, expiresAt: NOW + 1}))

    expect(await client.query({query: 'load', params: 1})).toEqual({result: 2})
    expect(request).toHaveBeenCalledTimes(1)
  })
})
