import {act, renderHook} from '@testing-library/react'
import React from 'react'
import {Provider, useSelector, useStore} from 'react-redux'
import {createStore} from 'redux'
import {createWithEqualityFn} from 'zustand/traditional'

import {withTypenames} from '../../createCache'
import {initializeForReact} from '../../react'
import {initializeForRedux} from '../../redux'
import {initializeForZustand} from '../../zustand'

type Item = {id: number; name: string}

const createTestCache = (logsEnabled: boolean) =>
  withTypenames<{items: Item}>().createCache({
    name: 'cache',
    cacheStateKey: '.',
    options: {logsEnabled},
    queries: {
      getItem: {
        query: async (id: number) => ({result: id, merge: {items: {[id]: {id, name: 'Item ' + id}}}}),
      },
    },
    mutations: {
      updateItem: {
        mutation: async (item: Item) => ({result: item.id, merge: {items: {[item.id]: item}}}),
      },
    },
  })

/** Performs main actions of the cache with different stores and hooks. */
const useCache = async (logsEnabled: boolean) => {
  // Redux with default hooks of react-redux

  const cache = createTestCache(logsEnabled)
  const {reducer, actions, utils} = initializeForRedux(cache)
  const {hooks} = initializeForReact(cache)
  const store = createStore(reducer)
  const client = utils.bindAsyncActions(store)
  const wrapper = ({children}: {children: React.ReactNode}) => <Provider store={store}>{children}</Provider>

  // Query: started, deduplicated while loading, cancelled by fetch policy
  await Promise.all([
    client.query({query: 'getItem', params: 1}),
    client.query({query: 'getItem', params: 1}),
  ])
  await client.query({query: 'getItem', params: 1, onlyIfExpired: true})

  // Mutation and entities
  await client.mutate({mutation: 'updateItem', params: {id: 1, name: 'updated'}})
  store.dispatch(actions.mergeEntityChanges({merge: {items: {2: {id: 2, name: 'two'}}}}))

  // Hooks: fetch skipped by option, fetch skipped by fetch policy because result is cached
  renderHook(() => hooks.useQuery({query: 'getItem', params: 3, skipFetch: true}), {wrapper})
  renderHook(() => hooks.useQuery({query: 'getItem', params: 1}), {wrapper})
  renderHook(() => hooks.useMutation({mutation: 'updateItem'}), {wrapper})
  await act(async () => {})

  // Redux with custom hooks

  const customHooksCache = createTestCache(logsEnabled)
  initializeForRedux(customHooksCache)
  initializeForReact(customHooksCache, {useStore, useSelector})

  // Zustand

  const zustandCache = createTestCache(logsEnabled)
  const zustandStore = createWithEqualityFn(() => zustandCache.utils.getInitialState())
  initializeForZustand(zustandCache, zustandStore)
  initializeForReact(zustandCache)
}

let debugSpy: jest.SpyInstance

beforeEach(() => {
  debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  debugSpy.mockRestore()
})

test('nothing is logged by default', async () => {
  await useCache(false)

  expect(debugSpy).not.toHaveBeenCalled()
})

test('debug logs are written when logsEnabled is true', async () => {
  await useCache(true)

  const tags = debugSpy.mock.calls.map(([tag]) => tag)
  expect(tags.every((tag) => tag.startsWith('@rrc ['))).toBe(true)

  const uniqueTags = [...new Set(tags)].sort()
  expect(uniqueTags).toStrictEqual(
    [
      '@rrc [applyEntityChanges]',
      '@rrc [createReducer]',
      '@rrc [initializeForReact]',
      '@rrc [initializeForZustand]',
      '@rrc [mutate finished]',
      '@rrc [mutate]',
      '@rrc [query fetch cancelled: already loading]',
      '@rrc [query fetch cancelled: fetch policy returned false]',
      '@rrc [query started]',
      '@rrc [useMutation]',
      '@rrc [useQuery.useEffect skip fetch due to fetch policy]',
      '@rrc [useQuery.useEffect skip fetch]',
      '@rrc [useQuery]',
    ].sort(),
  )

  const initializationMessages = debugSpy.mock.calls
    .filter(([tag]) => tag === '@rrc [initializeForReact]' || tag === '@rrc [initializeForZustand]')
    .map(([, message]) => message)
  expect(initializationMessages).toStrictEqual([
    'Initialized with react-redux global hooks',
    'Initialized with Redux custom hooks',
    'Initialized for Zustand',
    'Initialized with Zustand store hooks',
  ])
})
