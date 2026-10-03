/* eslint-disable @typescript-eslint/no-unused-vars */

import {useMemo} from 'react'

import {bindAsyncActions} from '../bindAsyncActions'
import type {
  AnyStore,
  Cache,
  CacheClient,
  CacheConfig,
  CacheOptions,
  CacheState,
  Dict,
  EntitiesMap,
  EntityChanges,
  EntityIds,
  Globals,
  Mutable,
  MutateOptions,
  Mutation,
  MutationInfo,
  MutationResponse,
  MutationResult,
  MutationState,
  NormalizedMutation,
  NormalizedMutationResponse,
  NormalizedQuery,
  NormalizedQueryResponse,
  OptionalPartial,
  PartialEntitiesMap,
  Query,
  QueryInfo,
  QueryOptions,
  QueryResponse,
  QueryResult,
  QueryState,
  QueryStateComparer,
  ReduxStoreLike,
  Typenames,
  UseQueryOptions,
  UseSelector,
  ZustandStoreLike,
} from '../types'
import {CacheExtensions, CachePrivate, CacheToPrivate, InnerStore, StoreHooksPrivate} from '../typesPrivate'
import {logDebug, logWarn} from '../utilsAndConstants'
import {useMutation} from './useMutation'
import {useQuery} from './useQuery'

export type StoreHooks = {
  useStore: () => ReduxStoreLike
  useSelector: UseSelector
}

/**
 * Initializes cache to be used with React, creates hooks. Use after initialization for the store.
 * @param reduxCustomStoreHooks Can be used to override defaut redux hooks, imported from "react-redux" package. Not needed for Zustand.
 */
export const initializeForReact = <N extends string, SK extends string, T extends Typenames, QP, QR, MP, MR>(
  cache: Cache<N, SK, T, QP, QR, MP, MR>,
  reduxCustomStoreHooks?: StoreHooks,
) => {
  const privateCache = cache as CacheToPrivate<typeof cache>
  const {
    config: {
      options,
      options: {logsEnabled},
    },
    selectors: {selectEntitiesByTypename, selectEntityById},
  } = privateCache

  // Set store hooks

  privateCache.extensions ??= {}
  if (privateCache.extensions.react !== undefined) {
    logWarn('initializeForReact', 'Already initialized for React')
  } else {
    privateCache.extensions.react ??= {} as CacheExtensions['react']
  }
  const reactExtension = privateCache.extensions.react!

  reactExtension.storeHooks ??= {} as StoreHooksPrivate
  if (reduxCustomStoreHooks !== undefined) {
    if (privateCache.extensions.zustand) {
      throw new Error(
        `[initializeForReact] Redux custom hooks can't be provided while cache is already initialized for Zustand`,
      )
    }

    reactExtension.storeHooks.useStore = reduxCustomStoreHooks.useStore
    reactExtension.storeHooks.useSelector = reduxCustomStoreHooks.useSelector
    reactExtension.storeHooks.useExternalStore = reduxCustomStoreHooks.useStore
    logsEnabled && logDebug('initializeForReact', 'Initialized with Redux custom hooks')
  } else if (privateCache.extensions.zustand) {
    const {innerStore, externalStore} = privateCache.extensions.zustand
    reactExtension.storeHooks.useStore = () => innerStore
    reactExtension.storeHooks.useSelector = externalStore
    reactExtension.storeHooks.useExternalStore = () => externalStore
    logsEnabled && logDebug('initializeForReact', 'Initialized with Zustand store hooks')
  } else {
    // Try/catch just for bunders like metro to consider this as optional dependency
    try {
      const useStore = require('react-redux').useStore
      const useSelector = require('react-redux').useSelector
      reactExtension.storeHooks.useStore = useStore
      reactExtension.storeHooks.useSelector = useSelector
      reactExtension.storeHooks.useExternalStore = useStore
    } catch {
      delete privateCache.extensions.react
      throw new Error("Custom store hooks haven't beed provided, and react-redux package wasn't found")
    }
    logsEnabled && logDebug('initializeForReact', 'Initialized with react-redux global hooks')
  }

  const storeHooks = reactExtension.storeHooks

  return {
    // doc-header
    hooks: {
      /**
       * Returns memoized object with query and mutate functions, binded to the store. Memoization dependency is the store.
       * @warning Not needed for Zustand, its actions are already binded to the store.
       */
      useClient: () => {
        const innerStore = storeHooks.useStore()
        const externalStore = storeHooks.useExternalStore()
        return useMemo(
          () => bindAsyncActions(privateCache, innerStore, externalStore),
          [externalStore, innerStore],
        )
      },
      /** Fetches query when params change and subscribes to query state changes (subscription depends on `selectorComparer`). */
      useQuery: <QK extends keyof (QP & QR)>(
        options: Parameters<typeof useQuery<N, SK, T, QP, QR, MP, MR, QK>>[1],
      ) => useQuery(privateCache, options),
      /** Subscribes to provided mutation state and provides mutate function. */
      useMutation: <MK extends keyof (MP & MR)>(
        options: Parameters<typeof useMutation<N, SK, T, QP, QR, MP, MR, MK>>[1],
      ) => useMutation(privateCache, options),
      /** useSelector + selectEntityById. */
      useSelectEntityById: <TN extends keyof T>(
        id: PropertyKey | null | undefined,
        typename: TN,
      ): T[TN] | undefined => {
        return storeHooks.useSelector((state: unknown) => selectEntityById(state, id, typename))
      },
      /**
       * useSelector + selectEntitiesByTypename. Also subscribes to collection's change key if `mutableCollections` enabled.
       * @warning Subscribing to collections should be avoided.
       * */
      useEntitiesByTypename: <TN extends keyof T>(typename: TN) => {
        if (options.mutableCollections) {
          storeHooks.useSelector((state) => selectEntitiesByTypename(state, typename)?._changeKey)
        }
        return storeHooks.useSelector((state) => selectEntitiesByTypename(state, typename))
      },
    },
  }
}
