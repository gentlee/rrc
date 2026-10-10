"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectors = void 0;
const utilsAndConstants_1 = require("./utilsAndConstants");
const createSelectors = (selectCacheState) => {
    const selectEntityById = (state, id, typename) => {
        var _a;
        return id == null ? undefined : (_a = selectCacheState(state).entities[typename]) === null || _a === void 0 ? void 0 : _a[id];
    };
    const selectQueryState = (state, query, cacheKey) => {
        var _a;
        return (_a = selectCacheState(state).queries[query][cacheKey]) !== null && _a !== void 0 ? _a : utilsAndConstants_1.EMPTY_OBJECT;
    };
    const selectMutationState = (state, mutation) => {
        var _a;
        return (_a = selectCacheState(state).mutations[mutation]) !== null && _a !== void 0 ? _a : utilsAndConstants_1.EMPTY_OBJECT;
    };
    return {
        selectCacheState,
        selectEntityById,
        selectQueryState,
        selectQueryResult: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).result;
        },
        selectQueryLoading: (state, query, cacheKey) => {
            var _a;
            return (_a = selectQueryState(state, query, cacheKey).loading) !== null && _a !== void 0 ? _a : false;
        },
        selectQueryError: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).error;
        },
        selectQueryParams: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).params;
        },
        selectQueryExpiresAt: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).expiresAt;
        },
        selectMutationState,
        selectMutationResult: (state, mutation) => {
            return selectMutationState(state, mutation).result;
        },
        selectMutationLoading: (state, mutation) => {
            var _a;
            return (_a = selectMutationState(state, mutation).loading) !== null && _a !== void 0 ? _a : false;
        },
        selectMutationError: (state, mutation) => {
            return selectMutationState(state, mutation).error;
        },
        selectMutationParams: (state, mutation) => {
            return selectMutationState(state, mutation).params;
        },
        selectEntities: (state) => {
            return selectCacheState(state).entities;
        },
        selectEntitiesByTypename: (state, typename) => {
            return selectCacheState(state).entities[typename];
        },
    };
};
exports.createSelectors = createSelectors;
