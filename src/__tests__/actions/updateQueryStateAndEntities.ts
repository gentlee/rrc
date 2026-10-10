import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {noop} from '../../utilsAndConstants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadingPromise = new Promise((x) => x({result: 0})) as any

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    reducer,
    actions: {updateQueryStateAndEntities},
  } = cache

  test('removes all default query fields, clears default query states', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const states = [reducer(undefined, {} as any)]

    states.push(
      reducer(
        states[0],
        updateQueryStateAndEntities('getUser', 'a', {
          result: 0,
          params: 0,
          loading: undefined,
          error: undefined,
          expiresAt: 100,
        }),
      ),
    )

    states.push(
      reducer(
        states[1],
        updateQueryStateAndEntities('getUser', 'a', {
          result: 2,
          params: 1,
          loading: loadingPromise,
          error: new Error('test'),
          expiresAt: undefined,
        }),
      ),
    )

    states.push(
      reducer(
        states[2],
        updateQueryStateAndEntities('getUser', 'a', {
          result: 0,
          params: 0,
          loading: undefined,
          error: undefined,
        }),
      ),
    )

    states.push(
      reducer(
        states[3],
        updateQueryStateAndEntities('getUser', 'a', {
          result: undefined,
          params: undefined,
        }),
      ),
    )

    expect(states.map((x) => x.queries.getUser.a)).toStrictEqual(
      cache.config.options.mutableCollections
        ? [undefined, undefined, undefined, undefined, undefined]
        : [
            undefined,
            {
              result: 0,
              params: 0,
              expiresAt: 100,
            },
            {
              result: 2,
              params: 1,
              loading: expect.any(Promise),
              error: new Error('test'),
            },
            {
              result: 0,
              params: 0,
            },
            undefined,
          ],
    )
  })

  test('should not change deeply equal params and result', () => {
    const store = createReduxStore(cache, false, false)
    const initialState = store.getState()

    const initialParams = {page: 1}
    const initialResult = {items: [1, 2, 3], page: 1}

    store.dispatch(
      updateQueryStateAndEntities('getUsers', 0, {
        params: initialParams,
        result: initialResult,
        loading: new Promise(noop),
      }),
    )

    for (let i = 0; i < 3; i += 1) {
      store.dispatch(
        updateQueryStateAndEntities('getUsers', 0, {
          params: {page: 1},
          result: {items: [1, 2, 3], page: 1},
          loading: undefined,
        }),
      )
    }

    expect(store.getState().cache.queries).toStrictEqual(
      withChangeKey(1, {
        ...initialState.cache.queries,
        getUsers: withChangeKey(1, {
          0: {
            params: initialParams,
            result: initialResult,
          },
        }),
      }),
    )
  })

  test('should replace loading promise when the rest of the state is deeply equal', () => {
    const store = createReduxStore(cache, false, false)

    const firstLoading = new Promise<never>(noop)
    const secondLoading = new Promise<never>(noop)

    store.dispatch(updateQueryStateAndEntities('getUsers', 0, {params: {page: 1}, loading: firstLoading}))
    store.dispatch(updateQueryStateAndEntities('getUsers', 0, {params: {page: 1}, loading: secondLoading}))

    expect(store.getState().cache.queries.getUsers[0]?.loading).toBe(secondLoading)
  })
})
