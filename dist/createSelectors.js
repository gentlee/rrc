"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectors = void 0;
const utilsAndConstants_1 = require("./utilsAndConstants");
const createSelectors = (selectCacheState) => {
    const selectEntityById = (state, id, typename) => {
        return id == null ? undefined : selectCacheState(state).entities[typename]?.[id];
    };
    const selectQueryState = (state, query, cacheKey) => {
        return selectCacheState(state).queries[query][cacheKey] ?? utilsAndConstants_1.EMPTY_OBJECT;
    };
    const selectMutationState = (state, mutation) => {
        return selectCacheState(state).mutations[mutation] ?? utilsAndConstants_1.EMPTY_OBJECT;
    };
    return {
        selectCacheState,
        selectEntityById,
        selectQueryState,
        selectQueryResult: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).result;
        },
        selectQueryLoading: (state, query, cacheKey) => {
            return selectQueryState(state, query, cacheKey).loading ?? false;
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
            return selectMutationState(state, mutation).loading ?? false;
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
