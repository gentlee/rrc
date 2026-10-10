"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCache = exports.withTypenames = void 0;
const createActions_1 = require("./createActions");
const createReducer_1 = require("./createReducer");
const createSelectors_1 = require("./createSelectors");
const utilsAndConstants_1 = require("./utilsAndConstants");
const withTypenames = () => {
    return {
        createCache: (partialConfig) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            var _m, _o, _p, _q, _r, _s, _t;
            const abortControllers = new WeakMap();
            (_a = partialConfig.options) !== null && _a !== void 0 ? _a : (partialConfig.options = {});
            (_b = (_m = partialConfig.options).mutableCollections) !== null && _b !== void 0 ? _b : (_m.mutableCollections = false);
            (_c = (_o = partialConfig.options).logsEnabled) !== null && _c !== void 0 ? _c : (_o.logsEnabled = false);
            (_d = (_p = partialConfig.options).additionalValidation) !== null && _d !== void 0 ? _d : (_p.additionalValidation = utilsAndConstants_1.IS_DEV);
            (_e = (_q = partialConfig.options).deepComparisonEnabled) !== null && _e !== void 0 ? _e : (_q.deepComparisonEnabled = true);
            (_f = partialConfig.globals) !== null && _f !== void 0 ? _f : (partialConfig.globals = {});
            (_g = (_r = partialConfig.globals).queries) !== null && _g !== void 0 ? _g : (_r.queries = {});
            (_h = (_s = partialConfig.globals.queries).fetchPolicy) !== null && _h !== void 0 ? _h : (_s.fetchPolicy = utilsAndConstants_1.FetchPolicy.NoCacheOrExpired);
            (_j = (_t = partialConfig.globals.queries).skipFetch) !== null && _j !== void 0 ? _j : (_t.skipFetch = false);
            (_k = partialConfig.mutations) !== null && _k !== void 0 ? _k : (partialConfig.mutations = {});
            (_l = partialConfig.queries) !== null && _l !== void 0 ? _l : (partialConfig.queries = {});
            const config = partialConfig;
            const { globals, cacheStateKey, queries, options } = config;
            const isRootState = cacheStateKey === '.' || cacheStateKey === '';
            if (options.deepComparisonEnabled && !utilsAndConstants_1.optionalUtils.deepEqual) {
                (0, utilsAndConstants_1.logWarn)('createCache', 'optional dependency for fast-deep-equal was not provided, while deepComparisonEnabled option is true');
            }
            setDefaultComparer(globals.queries);
            for (const queryKey in queries) {
                setDefaultComparer(queries[queryKey]);
            }
            const selectCacheState = isRootState
                ? (state) => state
                : (state) => state[cacheStateKey];
            const selectors = (0, createSelectors_1.createSelectors)(selectCacheState);
            const { selectQueryState, selectQueryResult, selectQueryLoading, selectQueryError, selectQueryParams, selectQueryExpiresAt, selectMutationState, selectMutationResult, selectMutationLoading, selectMutationError, selectMutationParams, selectEntityById, selectEntities, selectEntitiesByTypename, } = selectors;
            const actions = (0, createActions_1.createActions)(config.name);
            const reducer = (0, createReducer_1.createReducer)(actions, Object.keys(queries), options);
            const getRootState = isRootState
                ? (state) => state
                : (state) => ({ [cacheStateKey]: state });
            const getInitialState = () => {
                const state = reducer(undefined, utilsAndConstants_1.EMPTY_OBJECT);
                return getRootState(state);
            };
            const cache = {
                config,
                selectors: {
                    selectCacheState,
                    selectQueryState,
                    selectQueryResult,
                    selectQueryLoading,
                    selectQueryError,
                    selectQueryParams,
                    selectQueryExpiresAt,
                    selectMutationState,
                    selectMutationResult,
                    selectMutationLoading,
                    selectMutationError,
                    selectMutationParams,
                    selectEntityById,
                    selectEntities,
                    selectEntitiesByTypename,
                },
                utils: {
                    applyEntityChanges: (entities, changes) => {
                        return (0, utilsAndConstants_1.applyEntityChanges)(entities, changes, options);
                    },
                    getInitialState,
                },
            };
            const privateCache = cache;
            privateCache.reducer = reducer;
            privateCache.actions = actions;
            privateCache.abortControllers = abortControllers;
            privateCache.utils.getRootState = getRootState;
            return cache;
        },
    };
};
exports.withTypenames = withTypenames;
const setDefaultComparer = (target) => {
    if ((target === null || target === void 0 ? void 0 : target.selectorComparer) != null && typeof target.selectorComparer === 'object') {
        target.selectorComparer = (0, utilsAndConstants_1.createStateComparer)(target.selectorComparer);
    }
};
exports.createCache = (0, exports.withTypenames)().createCache;
