import {bindAsyncActions} from '../../bindAsyncActions'
import {createCache} from '../../createCache'
import {initializeForRedux} from '../../redux'
import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {CacheToPrivate} from '../../typesPrivate'

describe.each(testCaches)('%s query errors', (_, fixture) => {
  const mutable = fixture.config.options.mutableCollections

  const setup = (mutableCollections: boolean, request: (params: number) => Promise<{result: number}>) => {
    const onError = jest.fn(() => false)
    const onCompleted = jest.fn()
    const onSuccess = jest.fn()
    const globalError = jest.fn()
    const callbacks = {onError, onCompleted, onSuccess}
    const cache = createCache({
      name: 'errors',
      cacheStateKey: 'errors',
      options: {mutableCollections},
      globals: {onError: globalError},
      queries: {load: {query: request, ...callbacks}},
    })
    const {reducer, actions} = initializeForRedux(cache)
    const store = createReduxStore({...cache, reducer})
    const privateCache = cache as CacheToPrivate<typeof cache>
    const client = bindAsyncActions(privateCache, store, store)
    return {cache, store, actions, client, globalError, ...callbacks}
  }

  test.each([false, true])('handles Error (synchronous: %s)', async (synchronous) => {
    const reason = new Error('request failed')
    const request = jest.fn((_params: number): Promise<{result: number}> => {
      if (synchronous) {
        throw reason
      }
      return Promise.reject(reason)
    })
    const {cache, store, actions, client, onError, onCompleted, onSuccess, globalError} = setup(
      mutable,
      request,
    )
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 42}))
    const invoke = () => client.query({query: 'load', params: 1})
    const outcome = await invoke()
    expect(outcome).toEqual({error: reason, result: 42})
    expect(onError).toHaveBeenCalledWith(reason, 1, store)
    expect(globalError).toHaveBeenCalledWith(reason, 'load', 1, store)
    expect(onCompleted).toHaveBeenCalledWith(undefined, reason, 1, store)
    expect(onSuccess).not.toHaveBeenCalled()
    const state = cache.selectors.selectQueryState(store.getState(), 'load', 1)
    expect(state.loading).toBeUndefined()
    expect(state.params).toBe(1)
    expect(state.error).toBe(reason)

    request.mockResolvedValue({result: 2})
    expect(await invoke()).toEqual({result: 2})
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  test('dispatch errors propagate without invoking request error handlers', async () => {
    const {client, store, onError, globalError, onCompleted} = setup(mutable, async () => ({result: 1}))
    const error = new Error('dispatch')
    const dispatch = jest.spyOn(store, 'dispatch').mockImplementationOnce(() => {
      throw error
    })
    try {
      const promise = client.query({query: 'load', params: 1})
      await expect(promise).rejects.toBe(error)
      expect(dispatch).toHaveBeenCalledTimes(1)
      expect(onError).not.toHaveBeenCalled()
      expect(globalError).not.toHaveBeenCalled()
      expect(onCompleted).not.toHaveBeenCalled()
    } finally {
      dispatch.mockRestore()
    }
  })

  test.each(['onSuccess', 'onError', 'onCompleted'] as const)(
    'propagates exceptions from %s after cleanup',
    async (callback) => {
      const requestError = new Error('request')
      const callbackError = new Error('callback')
      const request = () =>
        callback === 'onError' ? Promise.reject(requestError) : Promise.resolve({result: 1})
      const {cache, client, store, globalError} = setup(mutable, request)
      const callbacks = {
        [callback]: () => {
          throw callbackError
        },
      }
      const promise = client.query({query: 'load', params: 1, ...callbacks})
      await expect(promise).rejects.toBe(callbackError)
      const state = cache.selectors.selectQueryState(store.getState(), 'load', 1)
      expect(state.loading).toBeUndefined()
      expect(globalError).not.toHaveBeenCalled()
    },
  )

  test('deduplicated queries return the request error', async () => {
    const reason = new Error('request failed')
    const request = jest.fn(() => Promise.reject(reason))
    const {client, onError, onCompleted} = setup(mutable, request)
    const first = client.query({query: 'load', params: 1})
    const second = client.query({query: 'load', params: 1})
    const [original, duplicate] = await Promise.all([first, second])
    expect(original).toEqual({error: reason, result: undefined})
    expect(duplicate).toEqual({cancelled: 'loading', error: reason, result: undefined})
    expect(request).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onCompleted).toHaveBeenCalledTimes(1)
  })

  test('mergeResults errors propagate without invoking request error handlers', async () => {
    const {cache, client, store, actions, onError, onSuccess, globalError} = setup(mutable, async () => ({
      result: 2,
    }))
    store.dispatch(actions.updateQueryStateAndEntities('load', 1, {result: 1}))
    const error = new Error('merge')
    const promise = client.query({
      query: 'load',
      params: 1,
      mergeResults: () => {
        throw error
      },
    })
    await expect(promise).rejects.toBe(error)
    expect(cache.selectors.selectQueryResult(store.getState(), 'load', 1)).toBe(1)
    expect(onError).not.toHaveBeenCalled()
    expect(globalError).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
