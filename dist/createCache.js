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
            var _a, _b, _c, _d, _e, _f, _g;
            const abortControllers = new WeakMap();
            partialConfig.options ?? (partialConfig.options = {});
            (_a = partialConfig.options).mutableCollections ?? (_a.mutableCollections = false);
            (_b = partialConfig.options).logsEnabled ?? (_b.logsEnabled = false);
            (_c = partialConfig.options).additionalValidation ?? (_c.additionalValidation = utilsAndConstants_1.IS_DEV);
            (_d = partialConfig.options).deepComparisonEnabled ?? (_d.deepComparisonEnabled = true);
            partialConfig.globals ?? (partialConfig.globals = {});
            (_e = partialConfig.globals).queries ?? (_e.queries = {});
            (_f = partialConfig.globals.queries).fetchPolicy ?? (_f.fetchPolicy = utilsAndConstants_1.FetchPolicy.NoCacheOrExpired);
            (_g = partialConfig.globals.queries).skipFetch ?? (_g.skipFetch = false);
            partialConfig.mutations ?? (partialConfig.mutations = {});
            partialConfig.queries ?? (partialConfig.queries = {});
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
    if (target?.selectorComparer != null && typeof target.selectorComparer === 'object') {
        target.selectorComparer = (0, utilsAndConstants_1.createStateComparer)(target.selectorComparer);
    }
};
exports.createCache = (0, exports.withTypenames)().createCache;
