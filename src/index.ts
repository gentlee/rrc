/* eslint-disable padding-line-between-statements */
export {createCache, withTypenames} from './createCache'
export * from './types'
export {
  createStateComparer,
  defaultGetCacheKey,
  FetchPolicy,
  isEmptyObject,
  isExpired,
  noop,
} from './utilsAndConstants'

// Backlog

// ! high (1.0.0-rc.0)
// type for external store state
// check query result deep equality

// ! medium
// remove empty states by query key
// enable / disable deep comparison for separate actions
// override deep comparison for entities & states
// override merge of entities & states
// optimistic response
// onCancel & onAbort
// remove empty entities and queries from state
// globals for success, completions and loading states?
// make query key / cache key difference more clear in the docs
// check type of function arguments in dev
// make skipFetch a function?
// example -> playground with changable options
// better zustand init
// persistor
// ImmutableJs?

// ! low
// make error type generic
// easy access to all currently loading queries and mutations?
// cancellation to queries
// if mutation & query already loading - make options: last, throttle, debounce, parallel?
// add refresh interval for queries that are mounted?
// readonly types?
// proper types, remove as, any, todo
// add number of retries param?
// mutation state wrong type - can be undefined?
// possibility to override logs to custom logger

// ! on hold
// better support queries without params: useQuery & selectors optional cache key (making useQuery params optional doesn't seem like a good idea)
// cancel all queries / mutations (already possible by recreating the store - this lib is pure)
