import {act, renderHook} from '@testing-library/react'
import React from 'react'
import {Provider} from 'react-redux'

import {initializeForReact} from '../../react'
import {useMutation} from '../../react/useMutation'
import {useQuery} from '../../react/useQuery'
import {generateTestEntitiesMap, generateTestUser} from '../../testing/api/utils'
import {createTestCache, testCaches} from '../../testing/redux/cache'
import {createReduxStore} from '../../testing/redux/store'
import {EMPTY_OBJECT} from '../../utilsAndConstants'

describe('hooks of not initialized cache', () => {
  const cache = createTestCache(false, undefined, undefined, false)
  const error = "@rrc Cache wasn't initialized for react. Check initializeForReact function."

  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    // React logs errors thrown while rendering.
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('useQuery throws', () => {
    expect(() => renderHook(() => useQuery(cache, {query: 'getUser', params: 0}))).toThrow(error)
  })

  test('useMutation throws', () => {
    expect(() => renderHook(() => useMutation(cache, {mutation: 'updateUser'}))).toThrow(error)
  })
})

describe.each(testCaches)('%s', (_, testCache) => {
  const mutableCollections = testCache.config.options.mutableCollections

  test('useSelectEntityById subscribes to entity of redux store', () => {
    const cache = createTestCache(mutableCollections)
    const store = createReduxStore(cache)
    const wrapper = ({children}: {children: React.ReactNode}) => <Provider store={store}>{children}</Provider>

    const {result, rerender} = renderHook(({id}) => cache.hooks!.useSelectEntityById(id, 'users'), {
      wrapper,
      initialProps: {id: 0 as number | null},
    })
    expect(result.current).toBeUndefined()

    act(() => {
      store.dispatch(cache.actions.mergeEntityChanges({merge: generateTestEntitiesMap(2)}))
    })
    expect(result.current).toStrictEqual(generateTestUser(0))

    rerender({id: 1})
    expect(result.current).toStrictEqual(generateTestUser(1))

    rerender({id: null})
    expect(result.current).toBeUndefined()
  })

  test('hooks use empty state when custom useSelector returns undefined', () => {
    const cache = createTestCache(mutableCollections, undefined, undefined, false)
    const store = createReduxStore(cache)
    const useSelector = jest.fn()
    const {hooks} = initializeForReact(cache, {useStore: () => store, useSelector})

    const query = renderHook(() => hooks.useQuery({query: 'getUser', params: 0, skipFetch: true}))
    const mutation = renderHook(() => hooks.useMutation({mutation: 'updateUser'}))

    expect(query.result.current[0]).toBe(EMPTY_OBJECT)
    expect(mutation.result.current[1]).toBe(EMPTY_OBJECT)
    expect(useSelector).toHaveBeenCalledTimes(2)
  })
})
