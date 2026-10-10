### Create cache

| Symbol | Description |
|--------|---------------|
| withTypenames | Function to provide generic Typenames if normalization is needed.  Returns object with createCache function with provided typenames.  @example  const cache = withTypenames<MyTypenames>().createCache({...}) |
| createCache | Creates cache with selectors, utils and full config with all default values set, that should be used for further initialization for specific stores and UI libs. |

##### Selectors

| Symbol | Description |
|--------|---------------|
| selectCacheState | Selects cache state from the root state. Depends on `cacheStateKey`. |
| selectQueryState | Selects query state. |
| selectQueryResult | Selects query latest result. |
| selectQueryLoading | Selects query loading state. |
| selectQueryError | Selects query latest error. |
| selectQueryParams | Selects query latest params. |
| selectQueryExpiresAt | Selects query latest expiresAt. |
| selectMutationState | Selects mutation state. |
| selectMutationResult | Selects mutation latest result. |
| selectMutationLoading | Selects mutation loading state. |
| selectMutationError | Selects mutation latest error. |
| selectMutationParams | Selects mutation latest params. |
| selectEntityById | Selects entity by id and typename. |
| selectEntities | Selects all entities. |
| selectEntitiesByTypename | Selects all entities of provided typename. |

##### Utils

| Symbol | Description |
|--------|---------------|
| applyEntityChanges | Apply changes to the entities map.  Returns `undefined` if nothing to change, otherwise new `EntitiesMap<T>` with applied changes.  Uses deep comparison if `deepComparisonEnabled` option is `true`.  Performs additional checks for intersections if `additionalValidation` option is `true`, and prints warnings if finds any issues. |
| getInitialState | Generates the initial root state using `cacheStateKey`. Not needed for Redux — it automatically generates it when creating the store by calling the root reducer. |


### Zustand

| Symbol | Description |
|--------|---------------|
| initializeForZustand | Initializes cache for Zustand, returning actions. |

##### Actions

| Symbol | Description |
|--------|---------------|
| query | Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.  @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.  @param skipFetch Fetch is cancelled and current cached result is returned. |
| mutate | Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished successfully. |
| updateQueryStateAndEntities | Updates query state, and optionally merges entity changes in a single action. |
| updateMutationStateAndEntities | Updates mutation state, and optionally merges entity changes in a single action. |
| mergeEntityChanges | Merges EntityChanges to the state. |
| invalidateQuery | Sets expiresAt to Date.now(). |
| clearQueryState | Clears states for provided query keys and cache keys.  If cache key for query key is not provided, the whole state for query key is cleared. |
| clearMutationState | Clears states for provided mutation keys. |
| clearCache | Replaces cache state with initial, optionally merging with provided state. Doesn't cancel running fetches and should be used with caution. |


### Redux

| Symbol | Description |
|--------|---------------|
| initializeForRedux | Initializes cache for Redux, returning reducer, actions, async actions and utils. |

##### Actions

| Symbol | Description |
|--------|---------------|
| updateQueryStateAndEntities | Updates query state, and optionally merges entity changes in a single action. |
| updateMutationStateAndEntities | Updates mutation state, and optionally merges entity changes in a single action. |
| mergeEntityChanges | Merges EntityChanges to the state. |
| invalidateQuery | Sets expiresAt to Date.now(). |
| clearQueryState | Clears states for provided query keys and cache keys.  If cache key for query key is not provided, the whole state for query key is cleared. |
| clearMutationState | Clears states for provided mutation keys. |
| clearCache | Replaces cache state with initial, optionally merging with provided state. Doesn't cancel running fetches and should be used with caution. |

##### Async actions

| Symbol | Description |
|--------|---------------|
| query | Performs a query using provided options. Deduplicates calls with the same cache key. Always returns current cached result, even when query is cancelled or finished with error.  @param onlyIfExpired When true, cancels fetch if fetch policy of the query returns false. With default policy - if result is cached and not yet expired.  @param skipFetch Fetch is cancelled and current cached result is returned. |
| mutate | Performs a mutation, aborting previous one with the same mutation key. Returns result only if finished successfully. |

##### Utils

| Symbol | Description |
|--------|---------------|
| bindAsyncActions | Binds async actions to the store. Can be used when the store is a singleton for direct import. |


### React

| Symbol | Description |
|--------|---------------|
| initializeForReact | Initializes cache to be used with React, creates hooks. Use after initialization for the store.  @param reduxCustomStoreHooks Can be used to override default redux hooks, imported from "react-redux" package. Not needed for Zustand. |

##### Hooks

| Symbol | Description |
|--------|---------------|
| useClient | Returns memoized object with query and mutate functions, bound to the store. Memoization dependency is the store.  @warning Not needed for Zustand, its actions are already bound to the store. |
| useQuery | Fetches query when params change and subscribes to query state changes (subscription depends on `selectorComparer`). |
| useMutation | Subscribes to provided mutation state and provides mutate function. |
| useSelectEntityById | useSelector + selectEntityById. |
| useEntitiesByTypename | useSelector + selectEntitiesByTypename. Also subscribes to collection's change key if `mutableCollections` enabled.  @warning Subscribing to collections should be avoided. |


### Utils and constants

| Symbol | Description |
|--------|---------------|
| noop | Empty function. |
| defaultGetCacheKey | Default getCacheKey implementation. |
| isEmptyObject | Returns true if object has no keys. |
| createStateComparer | Returns query state comparer that compares only provided fields. Used in implementation of `selectorComparer` option. |
| isExpired | Returns true if `expiresAt` is set and is lower than or equal to `now`. State without `expiresAt` never expires. |

##### FetchPolicy

| Symbol | Description |
|--------|---------------|
| NoCacheOrExpired | Only if cache does not exist (result is undefined) or expired (see `isExpired`). Default.  @param now Timestamp to compare `expiresAt` with. @Default Date.now() |
| Always | Every fetch trigger. |

