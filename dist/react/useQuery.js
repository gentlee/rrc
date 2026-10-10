"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuery = void 0;
const react_1 = require("react");
const query_1 = require("../query");
const utilsAndConstants_1 = require("../utilsAndConstants");
const utils_1 = require("./utils");
const useQuery = (cache, useQueryOptions) => {
    const { extensions, config: { queries, globals, options: configOptions }, selectors: { selectQueryState }, } = cache;
    const { query: queryKey, skipFetch = queries[queryKey].skipFetch ?? globals.queries.skipFetch ?? false, params, selectorComparer, secondsToLive, mergeResults, onCompleted, onSuccess, onError, fetchPolicy = queries[queryKey].fetchPolicy ?? globals.queries.fetchPolicy, } = useQueryOptions;
    (0, utils_1.validateStoreHooks)(extensions);
    const { useStore, useSelector, useExternalStore } = extensions.react.storeHooks;
    const innerStore = useStore();
    const externalStore = useExternalStore();
    const queryInfo = queries[queryKey];
    const logsEnabled = configOptions.logsEnabled;
    const getCacheKey = queryInfo.getCacheKey ?? (utilsAndConstants_1.defaultGetCacheKey);
    const comparer = selectorComparer === undefined
        ? (queryInfo.selectorComparer ??
            globals.queries.selectorComparer ??
            defaultStateComparer)
        : typeof selectorComparer === 'function'
            ? selectorComparer
            : (0, utilsAndConstants_1.createStateComparer)(selectorComparer);
    const cacheKey = getCacheKey(params);
    const query = (0, react_1.useCallback)(async (options) => {
        const paramsPassed = options && 'params' in options;
        return await (0, query_1.query)('useQuery.query', innerStore, externalStore, cache, queryKey, paramsPassed ? getCacheKey(options.params) : cacheKey, paramsPassed ? options.params : params, options?.onlyIfExpired, false, secondsToLive, mergeResults, onCompleted, onSuccess, onError, fetchPolicy);
    }, [
        cache,
        queryKey,
        cacheKey,
        externalStore,
        secondsToLive,
        getCacheKey,
        fetchPolicy,
        mergeResults,
        onCompleted,
        onError,
        onSuccess,
    ]);
    const queryState = useSelector((state) => {
        return selectQueryState(state, queryKey, cacheKey);
    }, comparer) ?? utilsAndConstants_1.EMPTY_OBJECT;
    (0, react_1.useEffect)(() => {
        if (skipFetch) {
            logsEnabled && (0, utilsAndConstants_1.logDebug)('useQuery.useEffect skip fetch', { skipFetch, queryKey, cacheKey });
            return;
        }
        if (!fetchPolicy(params, queryState, externalStore)) {
            logsEnabled &&
                (0, utilsAndConstants_1.logDebug)('useQuery.useEffect skip fetch due to fetch policy', {
                    queryState,
                    queryKey,
                    cacheKey,
                });
            return;
        }
        query();
    }, [queryKey, cacheKey, skipFetch, externalStore]);
    logsEnabled && (0, utilsAndConstants_1.logDebug)('useQuery', { cacheKey, options: useQueryOptions, queryState });
    return [queryState, query];
};
exports.useQuery = useQuery;
const defaultStateComparer = (0, utilsAndConstants_1.createStateComparer)(['result', 'loading', 'params', 'error']);
