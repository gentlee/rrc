import {act, render as renderImpl, renderHook} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import {assertEventLog, generateTestEntitiesMap, generateTestUser, logEvent} from '../../testing/api/utils'
import {testCaches} from '../../testing/redux/cache'
import {EMPTY_STATE} from '../../testing/redux/store'
import {createReduxStore} from '../../testing/redux/store'
import {advanceApiTimeout, advanceHalfApiTimeout} from '../../testing/utils'

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    config: {
      options: {mutableCollections},
    },
    selectors: {
      selectMutationError,
      selectMutationLoading,
      selectMutationParams,
      selectMutationResult,
      selectMutationState,
    },
    hooks,
  } = cache
  const {useMutation} = hooks!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let store: ReturnType<typeof createReduxStore<'cache', any, any, any, any, any>>
  let updateUser: ReturnType<typeof useMutation<'updateUser'>>[0]
  let mutationWithError: ReturnType<typeof useMutation<'mutationWithError'>>[0]
  let abort: () => void

  beforeEach(() => {
    store = createReduxStore(cache, true)
  })

  const wrapper = ({children}: {children: React.ReactNode}) => <Provider store={store}>{children}</Provider>

  test.each(['onSuccess', 'onCompleted', 'onError'] as const)(
    'useMutation keeps selector and abort stable when passed %s changes',
    (callback) => {
      const selector = jest.spyOn(cache.selectors, 'selectMutationState')
      try {
        const callbacks = {onSuccess: jest.fn(), onCompleted: jest.fn(), onError: jest.fn(() => true)}
        const {result, rerender} = renderHook(
          (callbacks) => useMutation({mutation: 'updateUser', ...callbacks}),
          {wrapper, initialProps: callbacks},
        )
        const [initialMutate, , initialAbort] = result.current
        const selectorCalls = selector.mock.calls.length

        rerender({...callbacks, [callback]: jest.fn(() => true)})

        const [currentMutate, , currentAbort] = result.current
        expect(currentMutate).not.toBe(initialMutate)
        expect(currentAbort).toBe(initialAbort)
        expect(selector).toHaveBeenCalledTimes(selectorCalls)

        act(() => {
          store.dispatch(cache.actions.updateMutationStateAndEntities('updateUser', {result: 0}))
        })

        const [mutateAfterUpdate, state, abortAfterUpdate] = result.current
        expect(state.result).toBe(0)
        expect(mutateAfterUpdate).toBe(currentMutate)
        expect(abortAfterUpdate).toBe(currentAbort)
      } finally {
        selector.mockRestore()
      }
    },
  )

  test('useMutation uses passed onSuccess and onCompleted for each invocation', async () => {
    const initialSuccess = jest.fn()
    const initialCompleted = jest.fn()
    const currentSuccess = jest.fn()
    const currentCompleted = jest.fn()
    const params = {id: 0, name: 'Updated'}
    const {result, rerender} = renderHook(
      ({onSuccess, onCompleted}) => useMutation({mutation: 'updateUser', onSuccess, onCompleted}),
      {wrapper, initialProps: {onSuccess: initialSuccess, onCompleted: initialCompleted}},
    )

    act(() => {
      const [mutate] = result.current
      mutate(params)
    })
    rerender({onSuccess: currentSuccess, onCompleted: currentCompleted})
    await act(advanceApiTimeout)
    expect(initialSuccess).toHaveBeenCalledTimes(1)
    expect(initialCompleted).toHaveBeenCalledTimes(1)
    expect(currentSuccess).not.toHaveBeenCalled()
    expect(currentCompleted).not.toHaveBeenCalled()

    act(() => {
      const [mutate] = result.current
      mutate(params)
    })
    await act(advanceApiTimeout)
    expect(initialSuccess).toHaveBeenCalledTimes(1)
    expect(initialCompleted).toHaveBeenCalledTimes(1)
    expect(currentSuccess).toHaveBeenCalledWith(expect.objectContaining({result: 0}), params, store)
    expect(currentCompleted).toHaveBeenCalledWith(
      expect.objectContaining({result: 0}),
      undefined,
      params,
      store,
    )
  })

  test('useMutation uses passed onError and onCompleted', async () => {
    const initialError = jest.fn(() => true)
    const initialCompleted = jest.fn()
    const currentError = jest.fn(() => true)
    const currentCompleted = jest.fn()
    const {result, rerender} = renderHook(
      ({onError, onCompleted}) => useMutation({mutation: 'mutationWithError', onError, onCompleted}),
      {wrapper, initialProps: {onError: initialError, onCompleted: initialCompleted}},
    )

    rerender({onError: currentError, onCompleted: currentCompleted})
    act(() => {
      const [mutate] = result.current
      mutate(undefined)
    })
    await act(advanceApiTimeout)

    expect(initialError).not.toHaveBeenCalled()
    expect(initialCompleted).not.toHaveBeenCalled()
    expect(currentError).toHaveBeenCalledWith(new Error('Test error'), undefined, store)
    expect(currentCompleted).toHaveBeenCalledWith(undefined, new Error('Test error'), undefined, store)
  })

  test('should be able to abort started mutation, mutation selectors work', async () => {
    store.dispatch({
      type: '@rrc/cache/mergeEntityChanges',
      changes: {merge: generateTestEntitiesMap(1)},
    })
    await act(() => render())

    // abort 1
    const abortResult1 = await act(() => abort())

    // abort 2
    let mutationResult1
    await act(() => {
      updateUser({id: 0, name: 'New name'}).then((x) => (mutationResult1 = x))
    })
    await act(advanceApiTimeout)
    const abortResult2 = await act(() => abort())

    // abort 3
    let mutationResult2
    await act(() => {
      updateUser({id: 0, name: 'New name 2'}).then((x) => (mutationResult2 = x))
    })
    await act(() => advanceHalfApiTimeout())
    const abortResult3 = await act(() => abort())
    await act(() => advanceHalfApiTimeout())

    expect(abortResult1).toBe(false)
    expect(abortResult2).toBe(false)
    expect(abortResult3).toBe(true)
    expect(mutationResult1).toStrictEqual({result: 0})
    expect(mutationResult2).toStrictEqual({aborted: true})
    expect(store.getState()).toStrictEqual({
      cache: {
        ...EMPTY_STATE,
        mutations: withChangeKey(3, {
          updateUser: {
            params: {id: 0, name: 'New name 2'},
          },
        }),
        entities: withChangeKey(1, {
          ...generateTestEntitiesMap(1, true, mutableCollections ? 0 : undefined),
          users: withChangeKey(1, {0: {...generateTestUser(0), name: 'New name'}}),
        }),
      },
    })
    expect(selectMutationState(store.getState(), 'updateUser')).toStrictEqual({
      params: {id: 0, name: 'New name 2'},
    })
    expect(selectMutationResult(store.getState(), 'updateUser')).toStrictEqual(undefined)
    expect(selectMutationLoading(store.getState(), 'updateUser')).toStrictEqual(false)
    expect(selectMutationError(store.getState(), 'updateUser')).toStrictEqual(undefined)
    expect(selectMutationParams(store.getState(), 'updateUser')).toStrictEqual({id: 0, name: 'New name 2'})
    assertEventLog([
      '@rrc/cache/mergeEntityChanges',
      'render: loading: undefined, result: undefined',
      '@rrc/cache/updateMutationStateAndEntities', // loading true
      'render: loading: [object Promise], result: undefined',
      '@rrc/cache/updateMutationStateAndEntities', // loading false, result 0
      'render: loading: undefined, result: 0',
      '@rrc/cache/updateMutationStateAndEntities', // loading true, result undefined
      'render: loading: [object Promise], result: undefined',
      '@rrc/cache/updateMutationStateAndEntities', // abort, loading false
      'render: loading: undefined, result: undefined',
    ])
  })

  test('handles errors', async () => {
    await act(() => render())

    await act(() => {
      mutationWithError(undefined)
    })
    await act(advanceApiTimeout)

    expect(selectMutationError(store.getState(), 'mutationWithError')).toHaveProperty('message', 'Test error')
    expect(cache.config.globals.onError).toBeCalledWith(
      new Error('Test error'),
      'mutationWithError',
      undefined,
      store,
    )
  })

  const render = () => {
    return renderImpl(
      <Provider store={store}>
        <UseMutationComponent />
      </Provider>,
    )
  }

  const UseMutationComponent = () => {
    let state
    ;[updateUser, state, abort] = useMutation({mutation: 'updateUser'})
    ;[mutationWithError] = useMutation({mutation: 'mutationWithError'})
    logEvent(`render: loading: ${state.loading}, result: ${state.result}`)
    return null
  }
})
