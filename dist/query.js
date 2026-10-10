"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const utilsAndConstants_1 = require("./utilsAndConstants");
const query = async (logTag, innerStore, externalStore, cache, queryKey, cacheKey, params, onlyIfExpired, skipFetch, secondsToLive = cache.config.queries[queryKey].secondsToLive ??
    cache.config.globals.queries.secondsToLive, mergeResults = cache.config.queries[queryKey].mergeResults, onCompleted = cache.config.queries[queryKey].onCompleted, onSuccess = cache.config.queries[queryKey].onSuccess, onError = cache.config.queries[queryKey].onError, fetchPolicy = cache.config.queries[queryKey].fetchPolicy ?? cache.config.globals.queries.fetchPolicy) => {
    const { config: { options: { logsEnabled }, queries, globals, }, actions, selectors: { selectQueryResult, selectQueryState }, } = cache;
    const queryStateOnStart = selectQueryState(innerStore.getState(), queryKey, cacheKey);
    if (skipFetch) {
        return { result: queryStateOnStart.result };
    }
    if (queryStateOnStart?.loading) {
        logsEnabled &&
            (0, utilsAndConstants_1.logDebug)(`${logTag} fetch cancelled: already loading`, { queryStateOnStart, params, cacheKey });
        const error = await queryStateOnStart.loading.then(utilsAndConstants_1.noop).catch(catchAndReturn);
        const result = selectQueryResult(innerStore.getState(), queryKey, cacheKey);
        const cancelled = 'loading';
        return error ? { cancelled, result, error } : { cancelled, result };
    }
    if (onlyIfExpired &&
        !fetchPolicy(params, queryStateOnStart, externalStore)) {
        logsEnabled &&
            (0, utilsAndConstants_1.logDebug)(`${logTag} fetch cancelled: not expired yet`, {
                queryStateOnStart,
                params,
                cacheKey,
                onlyIfExpired,
            });
        return { cancelled: 'not-expired', result: queryStateOnStart.result };
    }
    const { updateQueryStateAndEntities } = actions;
    let fetchPromise;
    let response;
    let error;
    try {
        fetchPromise = queries[queryKey].query(params, externalStore);
    }
    catch (e) {
        error = e;
    }
    try {
        if (!error) {
            innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, {
                loading: fetchPromise,
                params,
                error,
            }));
            logsEnabled &&
                (0, utilsAndConstants_1.logDebug)(`${logTag} started`, { queryKey, params, cacheKey, queryStateOnStart, onlyIfExpired });
            try {
                response = await fetchPromise;
            }
            catch (e) {
                error = e;
            }
        }
        if (error) {
            innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, {
                error,
                loading: undefined,
                params,
            }));
            if (!onError?.(error, params, externalStore)) {
                globals.onError?.(error, queryKey, params, externalStore);
            }
            onCompleted?.(undefined, error, params, externalStore);
            return { error, result: selectQueryResult(innerStore.getState(), queryKey, cacheKey) };
        }
        if (response) {
            const newState = {
                error: undefined,
                loading: undefined,
                expiresAt: response.expiresAt ?? (secondsToLive != null ? Date.now() + secondsToLive * 1000 : undefined),
                result: mergeResults
                    ? mergeResults(selectQueryResult(innerStore.getState(), queryKey, cacheKey), response, params, externalStore)
                    : response.result,
            };
            innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, newState, response));
            onSuccess?.(response, params, externalStore);
            onCompleted?.(response, undefined, params, externalStore);
            return { result: newState?.result };
        }
        throw new Error(`${logTag}: both error and response are not defined`);
    }
    finally {
        if (fetchPromise !== undefined &&
            selectQueryState(innerStore.getState(), queryKey, cacheKey).loading === fetchPromise) {
            innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, { loading: undefined }));
        }
    }
};
exports.query = query;
const catchAndReturn = (x) => x;
