"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForZustand = void 0;
const bindAsyncActions_1 = require("../bindAsyncActions");
const utilsAndConstants_1 = require("../utilsAndConstants");
const initializeForZustand = (cache, store) => {
    var _a, _b;
    var _c;
    const privateCache = cache;
    const { config: { options: { logsEnabled }, queries, }, reducer, actions, selectors: { selectCacheState }, utils: { getRootState }, } = privateCache;
    const dispatch = (action) => {
        const prevState = selectCacheState(store.getState());
        const newState = reducer(prevState, action);
        if (newState !== prevState) {
            store.setState(getRootState(newState));
        }
    };
    const innerStore = { dispatch, getState: store.getState };
    (_a = privateCache.extensions) !== null && _a !== void 0 ? _a : (privateCache.extensions = {});
    if (privateCache.extensions.zustand !== undefined) {
        (0, utilsAndConstants_1.logWarn)('initializeForZustand', 'Already initialized for Zustand');
    }
    (_b = (_c = privateCache.extensions).zustand) !== null && _b !== void 0 ? _b : (_c.zustand = {});
    privateCache.extensions.zustand.innerStore = innerStore;
    privateCache.extensions.zustand.externalStore = store;
    logsEnabled && (0, utilsAndConstants_1.logDebug)('initializeForZustand', 'Initialized for Zustand');
    const { clearCache, clearMutationState, clearQueryState, invalidateQuery, mergeEntityChanges, updateMutationStateAndEntities, updateQueryStateAndEntities, } = Object.keys(actions).reduce((result, key) => {
        const fn = actions[key];
        result[key] = function () {
            const action = fn.apply(undefined, arguments);
            return dispatch(action);
        };
        return result;
    }, {});
    const { query, mutate } = (0, bindAsyncActions_1.bindAsyncActions)(privateCache, innerStore, store);
    return {
        actions: {
            query,
            mutate,
            updateQueryStateAndEntities,
            updateMutationStateAndEntities,
            mergeEntityChanges,
            invalidateQuery,
            clearQueryState,
            clearMutationState,
            clearCache,
        },
    };
};
exports.initializeForZustand = initializeForZustand;
