import {bindAsyncActions} from '../../bindAsyncActions'
import {createCache} from '../../createCache'
import {initializeForRedux} from '../../redux'
import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {CacheToPrivate} from '../../typesPrivate'

describe.each(testCaches)('%s mutation errors', (_, fixture) => {
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
      mutations: {save: {mutation: request, ...callbacks}},
    })
    const {reducer} = initializeForRedux(cache)
    const store = createReduxStore({...cache, reducer})
    const privateCache = cache as CacheToPrivate<typeof cache>
    const client = bindAsyncActions(privateCache, store, store)
    return {cache, privateCache, store, client, globalError, ...callbacks}
  }

  test.each([false, true])('handles Error (synchronous: %s)', async (synchronous) => {
    const reason = new Error('request failed')
    const request = jest.fn((_params: number): Promise<{result: number}> => {
      if (synchronous) {
        throw reason
      }
      return Promise.reject(reason)
    })
    const {cache, privateCache, store, client, onError, onCompleted, onSuccess, globalError} = setup(
      mutable,
      request,
    )
    const invoke = () => client.mutate({mutation: 'save', params: 1})
    const outcome = await invoke()
    expect(outcome).toEqual({error: reason})
    expect(onError).toHaveBeenCalledWith(reason, 1, store)
    expect(globalError).toHaveBeenCalledWith(reason, 'save', 1, store)
    expect(onCompleted).toHaveBeenCalledWith(undefined, reason, 1, store)
    expect(onSuccess).not.toHaveBeenCalled()
    const state = cache.selectors.selectMutationState(store.getState(), 'save')
    expect(state.loading).toBeUndefined()
    expect(state.params).toBe(1)
    expect(state.error).toBe(reason)
    expect(privateCache.abortControllers.get(store)?.save).toBeUndefined()

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
      const promise = client.mutate({mutation: 'save', params: 1})
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
      const {cache, privateCache, client, store, globalError} = setup(mutable, request)
      const callbacks = {
        [callback]: () => {
          throw callbackError
        },
      }
      const promise = client.mutate({mutation: 'save', params: 1, ...callbacks})
      await expect(promise).rejects.toBe(callbackError)
      const state = cache.selectors.selectMutationState(store.getState(), 'save')
      expect(state.loading).toBeUndefined()
      expect(privateCache.abortControllers.get(store)?.save).toBeUndefined()
      expect(globalError).not.toHaveBeenCalled()
    },
  )

  test('an aborted mutation rejection cannot clear a newer controller or state', async () => {
    let rejectFirst!: (reason: unknown) => void
    let resolveSecond!: (response: {result: number}) => void
    const request = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<{result: number}>((_, reject) => {
            rejectFirst = reject
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<{result: number}>((resolve) => {
            resolveSecond = resolve
          }),
      )
    const {client, privateCache, cache, store, onError, onCompleted} = setup(mutable, request)
    const first = client.mutate({mutation: 'save', params: 1})
    const second = client.mutate({mutation: 'save', params: 2})
    const controller = privateCache.abortControllers.get(store)?.save
    rejectFirst(new Error('aborted request'))
    expect(await first).toEqual({aborted: true})
    expect(privateCache.abortControllers.get(store)?.save).toBe(controller)
    expect(cache.selectors.selectMutationParams(store.getState(), 'save')).toBe(2)
    expect(cache.selectors.selectMutationLoading(store.getState(), 'save')).toBeTruthy()
    expect(onError).not.toHaveBeenCalled()
    expect(onCompleted).not.toHaveBeenCalled()
    resolveSecond({result: 2})
    expect(await second).toEqual({result: 2})
    expect(privateCache.abortControllers.get(store)?.save).toBeUndefined()
  })
})
