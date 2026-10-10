# Changelog

Notable changes of each published version. Breaking changes are listed first.

## Unreleased

### Breaking changes

- **Fetch policy signature.** The `expired` argument is removed: `fetchPolicy(params, state, store)` instead of `fetchPolicy(expired, params, state, store)`. Use the new `isExpired(state.expiresAt)` util in custom policies:

  ```ts
  // Before
  fetchPolicy(expired, id, state, store) {
    if (expired) {
      return true
    }
    ...
  }

  // After
  fetchPolicy(id, state, store) {
    if (isExpired(state.expiresAt)) {
      return true
    }
    ...
  }
  ```

  A policy that still declares `expired` first can keep compiling, so check custom policies manually.

- **`onlyIfExpired` uses the fetch policy.** `query({onlyIfExpired: true})` now fetches only if the fetch policy of the query (query config, then globals, or the one passed to `useQuery`) returns `true`. With the default `FetchPolicy.NoCacheOrExpired` a cached result without `expiresAt` is no longer refetched: before it was, now the call is cancelled.
- **Cancellation reason is renamed.** `QueryResult.cancelled` is `'fetch-policy'` instead of `'not-expired'`, because the fetch can be cancelled by any fetch policy.
- **CommonJS only.** The ESM build is removed, the package now has a single CommonJS build with type declarations. The ESM build was not loadable by Node and failed at runtime in production builds of bundlers that do not transform `require` in ES modules (e.g. Vite), when `react-redux` hooks were not passed to `initializeForReact`. Entry points are the same: `rrc`, `rrc/react`, `rrc/redux`, `rrc/zustand`.
- **ES2020 output.** The package is compiled to ES2020 instead of ES2016 and requires an environment with native `async`/`await`, optional chaining and nullish coalescing, or a bundler that transpiles dependencies.
- **Peer dependencies.** Minimal versions are now `react >=16.8` and `react-redux >=7.1`, the first versions with hooks used by the library.
- **`Key` type is removed.** Use the built-in `PropertyKey` instead.

### Added

- `isExpired(expiresAt, now = Date.now())` util, exported from `rrc`.
- `FetchPolicy.NoCacheOrExpired` accepts an optional `now` timestamp as the fourth argument.
- Entity ids to remove can be passed as a `Set`.
- `skipFetch` can be set in the query config and in globals. Hook option overrides query config, which overrides globals.

### Fixed

- Query stayed in the loading state forever when `mergeResults` threw or the query function resolved with an empty response. Loading is now reset and the query can be retried, the error is still thrown.
- Synchronous errors thrown by query and mutation functions are handled the same way as rejected promises.
- Mutation started again with deeply equal params kept the `loading` promise of the aborted mutation in the state. The `loading` promise is now compared by reference.
- Abort controller of a manually aborted mutation was kept until the next mutation with the same key.
- `invalidateQuery` without cache key in a cache with `mutableCollections` handles `_changeKey` and symbol cache keys correctly.
- `useQuery` and `useMutation` use the latest callbacks passed to the hook, and `useQuery` supports changing the query key.
- The `query` function returned by `useQuery` no longer changes when only params change.
- Result types of `query` and `mutate` used params types instead of result types.
- Import of the library failed when neither `__DEV__` nor `process.env` was available.

### Changed

- Smaller build: 18.1 kB minified, 7.25 kB gzipped.
- Faster dispatch to Zustand stores.
- Documentation of `selectorComparer` for Zustand: the store should be created with `createWithEqualityFn`.
