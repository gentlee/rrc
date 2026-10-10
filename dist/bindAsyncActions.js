"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindAsyncActions = void 0;
const mutate_1 = require("./mutate");
const query_1 = require("./query");
const utilsAndConstants_1 = require("./utilsAndConstants");
const bindAsyncActions = (cache, innerStore, externalStore) => {
    const { config: { queries }, } = cache;
    return {
        query: (options) => {
            const { query: queryKey, params } = options;
            const getCacheKey = queries[queryKey].getCacheKey ?? (utilsAndConstants_1.defaultGetCacheKey);
            const cacheKey = getCacheKey(params);
            return (0, query_1.query)('query', innerStore, externalStore, cache, queryKey, cacheKey, params, options.onlyIfExpired, options.skipFetch, options.secondsToLive, options.mergeResults, options.onCompleted, options.onSuccess, options.onError);
        },
        mutate: (options) => {
            return (0, mutate_1.mutate)('mutate', innerStore, externalStore, cache, options.mutation, options.params, options.onCompleted, options.onSuccess, options.onError);
        },
    };
};
exports.bindAsyncActions = bindAsyncActions;
