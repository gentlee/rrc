import {withTypenames} from '../../createCache'
import {initializeForReact} from '../../react'
import {initializeForRedux} from '../../redux'
import {CacheToPrivate} from '../../typesPrivate'
import {isExpired} from '../../utilsAndConstants'
import {getUser, getUsers, removeUser, updateUser, updateUserNotNormalized} from '../api/mocks'
import type {Bank, User} from '../api/types'
import {logEvent} from '../api/utils'
import {throwErrorAfterTimeout, TTL_TIMEOUT, withChangeKey} from '../utils'

export type TestTypenames = {
  users: User
  banks: Bank
}

type TestWithChangeKey = (
  value: Parameters<typeof withChangeKey>[1],
  mutable: Parameters<typeof withChangeKey>[2],
) => typeof mutable

export const createTestCache = <SK extends string>(
  mutable: boolean,
  cacheStateKey?: SK,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectorComparer?: any,
  shouldInitializeForReact = true,
) => {
  const name = 'cache'
  const cache = withTypenames<TestTypenames>().createCache({
    name,
    cacheStateKey: cacheStateKey ?? name,
    options: {
      // logsEnabled: true,
      additionalValidation: true,
      // deepComparisonEnabled: false,
      mutableCollections: mutable,
    },
    globals: {
      onError: jest.fn(),
      queries: {
        selectorComparer,
      },
    },
    queries: {
      getUsers: {
        query: getUsers,
        getCacheKey: () => 'feed',
        mergeResults: (oldResult, {result: newResult}) => {
          if (!oldResult || newResult.page === 1) {
            logEvent('merge results: first page')
            return newResult
          }
          if (newResult.page === oldResult.page + 1) {
            logEvent('merge results: next page')
            return {
              ...newResult,
              items: oldResult.items.concat(newResult.items),
            }
          }
          logEvent('merge results: cancelled')
          return oldResult
        },
      },
      getUser: {
        query: getUser,
      },
      getUserTtl: {
        query: getUser,
        secondsToLive: TTL_TIMEOUT / 1000,
      },
      getUserExpires: {
        query: (id: number) => getUser(id).then((x) => ({...x, expiresAt: Date.now() + TTL_TIMEOUT})),
        secondsToLive: Infinity,
      },
      getFullUser: {
        query: getUser,
        fetchPolicy(id, state, {getState}): boolean {
          if (isExpired(state.expiresAt)) {
            return true
          }

          // fetch if user is not full
          const user = cache.selectors.selectEntityById(getState(), id, 'users')
          return !user || !('name' in user) || !('bankId' in user)
        },
      },
      queryWithError: {
        query: throwErrorAfterTimeout,
      },
      getUserWithResultComparer: {
        query: getUser,
        selectorComparer: ['result'],
      },
      getUserCustomCacheKey: {
        query: getUser,
        getCacheKey(params) {
          return JSON.stringify([params])
        },
      },
    },
    mutations: {
      updateUser: {
        mutation: updateUser,
      },
      removeUser: {
        mutation: removeUser,
      },
      mutationWithError: {
        mutation: throwErrorAfterTimeout,
      },
      updateUserNotNormalized: {
        mutation: updateUserNotNormalized,
      },
    },
  })
  const {actions, reducer} = initializeForRedux(cache)
  const hooks = shouldInitializeForReact ? initializeForReact(cache).hooks : undefined
  return {...(cache as CacheToPrivate<typeof cache>), actions, reducer, hooks}
}

export const testCache = createTestCache(false)

export const testMutableCache = createTestCache(true)

export const testCaches = [
  [
    'immutable',
    testCache,
    ((value, mutable) => withChangeKey(testCache, value, mutable)) as TestWithChangeKey,
  ],
  [
    'mutable',
    testMutableCache,
    ((value, mutable) => withChangeKey(testMutableCache, value, mutable)) as TestWithChangeKey,
  ],
] as const

// Comments for manual type checks:

// testCache.actions.updateQueryStateAndEntities('getUser', 'a', {
//   result: 0,
//   params: 0,
// })

// const state = testCache.reducer({} as ReturnType<typeof testCache.reducer>, null)
// state.entities.banks?.a
// state.queries.getUser.a?.result
// state.queries.getUser.a?.params
// state.queries.getUsers.a?.result
// state.queries.getUsers.a?.params
// state.mutations.removeUser.result
// state.mutations.removeUser.params
// state.mutations.updateUser.result
// state.mutations.updateUser.params

// testMutableCache.actions.updateQueryStateAndEntities('getUser', 'a', {
//   result: 0,
//   params: 0,
// })

// const mutableState = testMutableCache.reducer({} as ReturnType<typeof testMutableCache.reducer>, null)
// mutableState.entities.banks?.a
// mutableState.queries.getUser.a?.result
// mutableState.queries.getUser.a?.params
// mutableState.queries.getUsers.a?.result
// mutableState.queries.getUsers.a?.params
// mutableState.mutations.removeUser.result
// mutableState.mutations.removeUser.params
// mutableState.mutations.updateUser.result
// mutableState.mutations.updateUser.params
