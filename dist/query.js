"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const utilsAndConstants_1 = require("./utilsAndConstants");
const query = (logTag, innerStore, externalStore, cache, queryKey, cacheKey, params, onlyIfExpired, skipFetch, secondsToLive, mergeResults, onCompleted, onSuccess, onError) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (secondsToLive === void 0) { secondsToLive = (_a = cache.config.queries[queryKey].secondsToLive) !== null && _a !== void 0 ? _a : cache.config.globals.queries.secondsToLive; }
    if (mergeResults === void 0) { mergeResults = cache.config.queries[queryKey].mergeResults; }
    if (onCompleted === void 0) { onCompleted = cache.config.queries[queryKey].onCompleted; }
    if (onSuccess === void 0) { onSuccess = cache.config.queries[queryKey].onSuccess; }
    if (onError === void 0) { onError = cache.config.queries[queryKey].onError; }
    const { config: { options: { logsEnabled }, queries, globals, }, actions, selectors: { selectQueryResult, selectQueryState }, } = cache;
    const queryStateOnStart = selectQueryState(innerStore.getState(), queryKey, cacheKey);
    if (skipFetch) {
        return { result: queryStateOnStart.result };
    }
    if (queryStateOnStart === null || queryStateOnStart === void 0 ? void 0 : queryStateOnStart.loading) {
        logsEnabled &&
            (0, utilsAndConstants_1.logDebug)(`${logTag} fetch cancelled: already loading`, { queryStateOnStart, params, cacheKey });
        const error = yield queryStateOnStart.loading.then(utilsAndConstants_1.noop).catch(catchAndReturn);
        const result = selectQueryResult(innerStore.getState(), queryKey, cacheKey);
        const cancelled = 'loading';
        return error ? { cancelled, result, error } : { cancelled, result };
    }
    if (onlyIfExpired && (queryStateOnStart === null || queryStateOnStart === void 0 ? void 0 : queryStateOnStart.expiresAt) != null && queryStateOnStart.expiresAt > Date.now()) {
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
    if (!error) {
        innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, {
            loading: fetchPromise,
            params,
            error,
        }));
        logsEnabled &&
            (0, utilsAndConstants_1.logDebug)(`${logTag} started`, { queryKey, params, cacheKey, queryStateOnStart, onlyIfExpired });
        try {
            response = yield fetchPromise;
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
        if (!(onError === null || onError === void 0 ? void 0 : onError(error, params, externalStore))) {
            (_b = globals.onError) === null || _b === void 0 ? void 0 : _b.call(globals, error, queryKey, params, externalStore);
        }
        onCompleted === null || onCompleted === void 0 ? void 0 : onCompleted(undefined, error, params, externalStore);
        return { error, result: selectQueryResult(innerStore.getState(), queryKey, cacheKey) };
    }
    if (response) {
        const newState = {
            error: undefined,
            loading: undefined,
            expiresAt: (_c = response.expiresAt) !== null && _c !== void 0 ? _c : (secondsToLive != null ? Date.now() + secondsToLive * 1000 : undefined),
            result: mergeResults
                ? mergeResults(selectQueryResult(innerStore.getState(), queryKey, cacheKey), response, params, externalStore)
                : response.result,
        };
        innerStore.dispatch(updateQueryStateAndEntities(queryKey, cacheKey, newState, response));
        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(response, params, externalStore);
        onCompleted === null || onCompleted === void 0 ? void 0 : onCompleted(response, undefined, params, externalStore);
        return { result: newState === null || newState === void 0 ? void 0 : newState.result };
    }
    throw new Error(`${logTag}: both error and response are not defined`);
});
exports.query = query;
const catchAndReturn = (x) => x;
