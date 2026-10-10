import {act, render as renderImpl} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import {
  assertEventLog,
  generateTestBank,
  generateTestEntitiesMap,
  generateTestUser,
  logEvent,
} from '../../testing/api/utils'
import {testCaches} from '../../testing/redux/cache'
import {EMPTY_STATE} from '../../testing/redux/store'
import {createReduxStore} from '../../testing/redux/store'
import {advanceApiTimeout, advanceHalfApiTimeout} from '../../testing/utils'

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    actions: {mergeEntityChanges},
    hooks,
  } = cache
  const {useClient} = hooks!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: ReturnType<typeof createReduxStore<'cache', any, any, any, any, any>>
  let mutate: ReturnType<typeof useClient>['mutate']

  beforeEach(() => {
    store = createReduxStore(cache, true)
  })

  test('should update mutation state and return result', async () => {
    store.dispatch({
      type: '@rrc/cache/mergeEntityChanges',
      changes: {merge: generateTestEntitiesMap(1)},
    })
    await act(() => render())

    let result
    await act(() => {
      mutate({
        mutation: 'updateUser',
        params: {id: 0, name: 'New name'},
      }).then((x) => (result = x))
    })
    await act(() => advanceApiTimeout())

    expect(result).toStrictEqual({result: 0})
    expect(store.getState()).toStrictEqual({
      cache: {
        ...EMPTY_STATE,
        mutations: withChangeKey(1, {
          updateUser: {
            params: {id: 0, name: 'New name'},
            result: 0,
          },
        }),
        entities: withChangeKey(1, {
          banks: withChangeKey(0, {0: generateTestBank('0')}),
          users: withChangeKey(1, {0: {...generateTestUser(0), name: 'New name'}}),
        }),
      },
    })
    assertEventLog([
      '@rrc/cache/mergeEntityChanges',
      'render',
      '@rrc/cache/updateMutationStateAndEntities',
      '@rrc/cache/updateMutationStateAndEntities',
    ])
  })

  test('mutate should cancel previous not finished mutation and update loading promise & params', async () => {
    store.dispatch(mergeEntityChanges({merge: generateTestEntitiesMap(2)}))
    await act(() => render())

    let result1
    await act(() => {
      mutate({
        mutation: 'updateUser',
        params: {id: 0, name: 'New name'},
      }).then((x) => (result1 = x))
    })
    await act(() => advanceHalfApiTimeout())

    let result2
    await act(() => {
      mutate({
        mutation: 'updateUser',
        params: {id: 1, name: 'New name 2'},
      }).then((x) => (result2 = x))
    })
    await act(() => advanceApiTimeout())

    expect(result1).toStrictEqual({aborted: true})
    expect(result2).toStrictEqual({result: 1})
    expect(store.getState()).toStrictEqual({
      cache: {
        ...EMPTY_STATE,
        mutations: withChangeKey(2, {
          updateUser: {
            result: 1,
            params: {id: 1, name: 'New name 2'},
          },
        }),
        entities: withChangeKey(1, {
          ...generateTestEntitiesMap(2, true, cache.config.options.mutableCollections ? 0 : undefined),
          users: withChangeKey(1, {
            0: generateTestUser(0),
            1: {...generateTestUser(1), name: 'New name 2'},
          }),
        }),
      },
    })
    assertEventLog([
      '@rrc/cache/mergeEntityChanges',
      'render',
      '@rrc/cache/updateMutationStateAndEntities', // loading 1
      '@rrc/cache/updateMutationStateAndEntities', // loading 2
      '@rrc/cache/updateMutationStateAndEntities', // result
    ])
  })

  const MutateComponent = () => {
    mutate = useClient().mutate
    logEvent('render')
    return null
  }

  const render = () => {
    return renderImpl(
      <Provider store={store}>
        <MutateComponent />
      </Provider>,
    )
  }
})
