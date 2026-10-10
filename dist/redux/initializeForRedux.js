"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForRedux = void 0;
const bindAsyncActions_1 = require("../bindAsyncActions");
const mutate_1 = require("../mutate");
const query_1 = require("../query");
const utilsAndConstants_1 = require("../utilsAndConstants");
const initializeForRedux = (cache) => {
    const privateCache = cache;
    const { config: { queries }, actions: { clearCache, clearMutationState, clearQueryState, invalidateQuery, mergeEntityChanges, updateMutationStateAndEntities, updateQueryStateAndEntities, }, } = privateCache;
    const result = {
        reducer: privateCache.reducer,
        actions: {
            updateQueryStateAndEntities,
            updateMutationStateAndEntities,
            mergeEntityChanges,
            invalidateQuery,
            clearQueryState,
            clearMutationState,
            clearCache,
        },
        asyncActions: {
            query: (store, options) => {
                const { query: queryKey, params } = options;
                const getCacheKey = queries[queryKey].getCacheKey ?? (utilsAndConstants_1.defaultGetCacheKey);
                const cacheKey = getCacheKey(params);
                return (0, query_1.query)('asyncActions.query', store, store, privateCache, queryKey, cacheKey, params, options.onlyIfExpired, options.skipFetch, options.secondsToLive, options.mergeResults, options.onCompleted, options.onSuccess, options.onError);
            },
            mutate: (store, options) => {
                return (0, mutate_1.mutate)('asyncActions.mutate', store, store, privateCache, options.mutation, options.params, options.onCompleted, options.onSuccess, options.onError);
            },
        },
        utils: {
            bindAsyncActions: (store) => (0, bindAsyncActions_1.bindAsyncActions)(privateCache, store, store),
        },
    };
    return result;
};
exports.initializeForRedux = initializeForRedux;
