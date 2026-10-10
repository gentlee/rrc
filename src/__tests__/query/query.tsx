import {act, render as renderImpl} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import {assertEventLog, generateTestEntitiesMap, logEvent} from '../../testing/api/utils'
import {testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {advanceHalfApiTimeout} from '../../testing/utils'

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    actions: {updateQueryStateAndEntities},
    config: {
      options: {mutableCollections},
    },
    hooks,
  } = cache
  const {useClient} = hooks!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: ReturnType<typeof createReduxStore<'cache', any, any, any, any, any>>
  let query: ReturnType<typeof useClient>['query']
  let EMPTY_STATE: ReturnType<typeof store.getState>

  beforeEach(() => {
    store = createReduxStore(cache, true)
    EMPTY_STATE = store.getState()
  })

  test('should cancel fetch when already loading or not expited, and return the previous result', async () => {
    await act(() => render())

    let result_user0_1_first
    let result_user0_2_loading
    let result_user0_3_loading
    let result_user0_4_cached
    let result_user1_1_first
    let result_user1_2_loading

    await act(() => {
      query({query: 'getUserTtl', params: 0}).then((x) => (result_user0_1_first = x))
    })
    await act(() => {
      query({query: 'getUserTtl', params: 0}).then((x) => (result_user0_2_loading = x))
    })
    await act(() => {
      query({query: 'getUserTtl', params: 1}).then((x) => (result_user1_1_first = x))
    })

    await act(() => advanceHalfApiTimeout())

    await act(() => {
      query({query: 'getUserTtl', params: 0}).then((x) => (result_user0_3_loading = x))
    })
    await act(() => {
      query({query: 'getUserTtl', params: 1}).then((x) => (result_user1_2_loading = x))
    })

    await act(() => advanceHalfApiTimeout())

    await act(() => {
      query({query: 'getUserTtl', params: 0, onlyIfExpired: true}).then((x) => (result_user0_4_cached = x))
    })

    expect(result_user0_1_first).toStrictEqual({result: 0})
    expect(result_user0_2_loading).toStrictEqual({result: 0, cancelled: 'loading'})
    expect(result_user0_3_loading).toStrictEqual({result: 0, cancelled: 'loading'})
    expect(result_user0_4_cached).toStrictEqual({result: 0, cancelled: 'fetch-policy'})
    expect(result_user1_1_first).toStrictEqual({result: 1})
    expect(result_user1_2_loading).toStrictEqual({result: 1, cancelled: 'loading'})
    expect(store.getState()).toStrictEqual({
      cache: {
        ...EMPTY_STATE.cache,
        queries: withChangeKey(3, {
          ...EMPTY_STATE.cache.queries,
          getUserTtl: withChangeKey(3, {
            0: {result: 0, params: 0, expiresAt: expect.any(Number)},
            1: {result: 1, params: 1, expiresAt: expect.any(Number)},
          }),
        }),
        entities: withChangeKey(1, generateTestEntitiesMap(2, true, mutableCollections ? 1 : undefined)),
      },
    })
    assertEventLog([
      'render',
      '@rrc/cache/updateQueryStateAndEntities', // load started 0
      '@rrc/cache/updateQueryStateAndEntities', // load started 1
      '@rrc/cache/updateQueryStateAndEntities', // load finished 0
      '@rrc/cache/updateQueryStateAndEntities', // load finished 1
    ])
  })

  test('should return current result without fetch with skipFetch: true', async () => {
    await act(() => render())
    assertEventLog(['render'])

    let result
    await act(() => {
      query({query: 'getUser', params: 0, skipFetch: true}).then((x) => (result = x))
    })
    assertEventLog([])
    await act(() => advanceHalfApiTimeout())
    assertEventLog([])

    store.dispatch(updateQueryStateAndEntities('getUser', 0, {result: 0}))
    assertEventLog(['@rrc/cache/updateQueryStateAndEntities'])

    let result2
    await act(() => {
      query({query: 'getUser', params: 0, skipFetch: true}).then((x) => (result2 = x))
    })
    assertEventLog([])
    await act(() => advanceHalfApiTimeout())
    assertEventLog([])

    expect(result).toStrictEqual({result: undefined})
    expect(result2).toStrictEqual({result: 0})
  })

  const QueryComponent = () => {
    query = useClient().query
    logEvent('render')
    return null
  }

  const render = () => {
    return renderImpl(
      <Provider store={store}>
        <QueryComponent />
      </Provider>,
    )
  }
})
