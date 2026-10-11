import {act, renderHook} from '@testing-library/react'
import {createWithEqualityFn} from 'zustand/traditional'

import {withTypenames} from '../../createCache'
import {initializeForReact} from '../../react'
import {initializeForZustand} from '../../zustand'

type Item = {id: number; name: string}

type Typenames = {items: Item}

/** Flushes promises of the fake api, which resolves without timers. */
const flush = () => act(async () => {})

describe.each([false, true])('zustand with react (mutableCollections: %s)', (mutableCollections) => {
  const setup = () => {
    const getItem = jest.fn(async (id: number) => ({
      result: id,
      merge: {items: {[id]: {id, name: 'Item ' + id}}},
    }))
    const updateItem = jest.fn(async (item: Item) => ({
      result: item.id,
      merge: {items: {[item.id]: item}},
    }))
    const cache = withTypenames<Typenames>().createCache({
      name: 'cache',
      cacheStateKey: 'cache',
      options: {mutableCollections},
      queries: {getItem: {query: getItem}},
      mutations: {updateItem: {mutation: updateItem}},
    })
    const store = createWithEqualityFn(() => ({...cache.utils.getInitialState(), other: 'value'}))
    const {actions} = initializeForZustand(cache, store)
    const {hooks} = initializeForReact(cache)
    return {cache, store, actions, hooks, getItem, updateItem}
  }

  test('actions update the store and keep other state', () => {
    const {cache, store, actions} = setup()
    const initialCacheState = store.getState().cache

    actions.mergeEntityChanges({merge: {items: {1: {id: 1, name: 'one'}}}})

    const state = store.getState()
    expect(state.other).toBe('value')
    expect(state.cache).not.toBe(initialCacheState)
    expect(cache.selectors.selectEntityById(state, 1, 'items')).toStrictEqual({id: 1, name: 'one'})
  })

  test('useQuery fetches and subscribes to the store', async () => {
    const {cache, store, hooks, getItem} = setup()

    const {result} = renderHook(() => hooks.useQuery({query: 'getItem', params: 1}))
    expect(result.current[0].loading).toBeInstanceOf(Promise)
    await flush()

    expect(result.current[0]).toStrictEqual({result: 1, params: 1})
    expect(getItem).toHaveBeenCalledTimes(1)
    expect(getItem).toHaveBeenCalledWith(1, store)
    expect(cache.selectors.selectQueryResult(store.getState(), 'getItem', 1)).toBe(1)
    expect(cache.selectors.selectEntityById(store.getState(), 1, 'items')).toStrictEqual({
      id: 1,
      name: 'Item 1',
    })

    // Refetch returns the same promise result and keeps the state.
    let refetchResult
    await act(async () => {
      refetchResult = await result.current[1]()
    })
    expect(refetchResult).toStrictEqual({result: 1})
    expect(getItem).toHaveBeenCalledTimes(2)
  })

  test('useMutation mutates and subscribes to the store', async () => {
    const {cache, store, hooks, updateItem} = setup()

    const {result} = renderHook(() => hooks.useMutation({mutation: 'updateItem'}))
    expect(result.current[1]).toStrictEqual({})

    let mutationResult
    await act(async () => {
      mutationResult = await result.current[0]({id: 1, name: 'updated'})
    })

    expect(mutationResult).toStrictEqual({result: 1})
    expect(updateItem).toHaveBeenCalledWith({id: 1, name: 'updated'}, store, expect.any(AbortSignal))
    expect(result.current[1]).toStrictEqual({result: 1, params: {id: 1, name: 'updated'}})
    expect(cache.selectors.selectEntityById(store.getState(), 1, 'items')).toStrictEqual({
      id: 1,
      name: 'updated',
    })
  })

  test('useMutation abort clears loading state', async () => {
    const {store, hooks, cache} = setup()
    const {result} = renderHook(() => hooks.useMutation({mutation: 'updateItem'}))

    let mutationResult
    act(() => {
      result.current[0]({id: 1, name: 'updated'}).then((x) => (mutationResult = x))
    })
    expect(result.current[1].loading).toBeInstanceOf(Promise)

    let aborted
    act(() => {
      aborted = result.current[2]()
    })
    await flush()

    expect(aborted).toBe(true)
    expect(mutationResult).toStrictEqual({aborted: true})
    expect(result.current[1].loading).toBeUndefined()
    expect(cache.selectors.selectEntityById(store.getState(), 1, 'items')).toBeUndefined()
    // Nothing to abort anymore.
    expect(result.current[2]()).toBe(false)
  })

  test('useSelectEntityById and useEntitiesByTypename subscribe to entities', () => {
    const {actions, hooks} = setup()

    const {result} = renderHook(() => ({
      item: hooks.useSelectEntityById(1, 'items'),
      missing: hooks.useSelectEntityById(null, 'items'),
      items: hooks.useEntitiesByTypename('items'),
    }))
    expect(result.current).toStrictEqual({item: undefined, missing: undefined, items: undefined})

    act(() => actions.mergeEntityChanges({merge: {items: {1: {id: 1, name: 'one'}}}}))

    expect(result.current.item).toStrictEqual({id: 1, name: 'one'})
    expect(result.current.missing).toBeUndefined()
    expect(result.current.items![1]).toBe(result.current.item)

    act(() => actions.mergeEntityChanges({merge: {items: {2: {id: 2, name: 'two'}}}}))

    expect(result.current.items![2]).toStrictEqual({id: 2, name: 'two'})
  })

  test('useClient returns query and mutate bound to the store', async () => {
    const {cache, store, hooks, getItem} = setup()
    const {result, rerender} = renderHook(() => hooks.useClient())
    const client = result.current

    rerender()
    expect(result.current).toBe(client)

    let queryResult
    await act(async () => {
      queryResult = await client.query({query: 'getItem', params: 2})
    })

    expect(queryResult).toStrictEqual({result: 2})
    expect(getItem).toHaveBeenCalledWith(2, store)
    expect(cache.selectors.selectQueryResult(store.getState(), 'getItem', 2)).toBe(2)
  })

  test('selectorComparer limits rerenders with store created by createWithEqualityFn', async () => {
    const {actions, hooks} = setup()
    let renders = 0

    const {result} = renderHook(() => {
      renders += 1
      return hooks.useQuery({query: 'getItem', params: 1, skipFetch: true, selectorComparer: ['result']})
    })
    expect(renders).toBe(1)

    // Not subscribed fields do not cause rerender.
    act(() => actions.updateQueryStateAndEntities('getItem', 1, {params: 1, expiresAt: 100}))
    expect(renders).toBe(1)

    act(() => actions.updateQueryStateAndEntities('getItem', 1, {result: 1}))
    expect(renders).toBe(2)
    expect(result.current[0].result).toBe(1)
  })
})
