import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {noop} from '../../utilsAndConstants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadingPromise = new Promise((x) => x({result: 0})) as any

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    reducer,
    actions: {updateMutationStateAndEntities},
  } = cache

  test('removes all default mutation fields, clears default mutation states', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const states = [reducer(undefined, {} as any)]

    states.push(
      reducer(
        states[0],
        updateMutationStateAndEntities('updateUser', {
          result: 0,
          params: {id: 0, name: 'test'},
          loading: loadingPromise,
          error: undefined,
        }),
      ),
    )

    states.push(
      reducer(
        states[1],
        updateMutationStateAndEntities('updateUser', {
          result: 2,
          params: {id: 1, name: 'test2'},
          loading: undefined,
          error: new Error('test'),
        }),
      ),
    )

    states.push(
      reducer(
        states[2],
        updateMutationStateAndEntities('updateUser', {
          result: 0,
          params: undefined,
          error: undefined,
        }),
      ),
    )

    states.push(
      reducer(
        states[3],
        updateMutationStateAndEntities('updateUser', {
          result: undefined,
          params: undefined,
        }),
      ),
    )

    expect(states.map((x) => x.mutations.updateUser)).toStrictEqual(
      cache.config.options.mutableCollections
        ? [undefined, undefined, undefined, undefined, undefined]
        : [
            undefined,
            {
              result: 0,
              params: {id: 0, name: 'test'},
              loading: loadingPromise,
            },
            {
              result: 2,
              params: {id: 1, name: 'test2'},
              error: new Error('test'),
            },
            {
              result: 0,
            },
            undefined,
          ],
    )
  })

  test('should not change deeply equal params and result', () => {
    const store = createReduxStore(cache)

    const initialParams = {id: 1, name: '2'}
    const initialResult = {id: 1, name: '2'}

    store.dispatch(
      updateMutationStateAndEntities('updateUserNotNormalized', {
        params: initialParams,
        result: initialResult,
        loading: new Promise(noop),
      }),
    )

    store.dispatch(
      updateMutationStateAndEntities('updateUserNotNormalized', {
        params: {id: 1, name: '2'},
        result: {id: 1, name: '2'},
        loading: undefined,
      }),
    )

    expect(store.getState().cache.mutations).toStrictEqual(
      withChangeKey(1, {
        updateUserNotNormalized: {
          params: initialParams,
          result: initialResult,
        },
      }),
    )
  })

  test('should replace loading promise when the rest of the state is deeply equal', () => {
    const store = createReduxStore(cache)

    const firstLoading = new Promise<never>(noop)
    const secondLoading = new Promise<never>(noop)

    store.dispatch(
      updateMutationStateAndEntities('updateUserNotNormalized', {
        params: {id: 1, name: '2'},
        loading: firstLoading,
      }),
    )
    store.dispatch(
      updateMutationStateAndEntities('updateUserNotNormalized', {
        params: {id: 1, name: '2'},
        loading: secondLoading,
      }),
    )

    expect(store.getState().cache.mutations.updateUserNotNormalized?.loading).toBe(secondLoading)
  })
})
