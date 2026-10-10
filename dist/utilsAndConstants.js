"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementChangeKey = exports.FetchPolicy = exports.isExpired = exports.createStateComparer = exports.isEmptyObject = exports.applyEntityChanges = exports.defaultGetCacheKey = exports.noop = exports.EMPTY_ARRAY = exports.EMPTY_OBJECT = exports.IS_DEV = exports.logWarn = exports.logDebug = exports.optionalUtils = exports.PACKAGE_SHORT_NAME = void 0;
exports.PACKAGE_SHORT_NAME = 'rrc';
exports.optionalUtils = {
    deepEqual: undefined,
};
const logDebug = (tag, data) => {
    console.debug(`@${exports.PACKAGE_SHORT_NAME} [${tag}]`, data);
};
exports.logDebug = logDebug;
const logWarn = (tag, data) => {
    console.warn(`@${exports.PACKAGE_SHORT_NAME} [${tag}]`, data);
};
exports.logWarn = logWarn;
try {
    exports.optionalUtils.deepEqual = require('fast-deep-equal/es6');
}
catch {
    (0, exports.logDebug)('deepEqual', 'fast-deep-equal optional dependency was not installed');
}
exports.IS_DEV = (() => {
    try {
        return __DEV__;
    }
    catch {
        try {
            return process.env.NODE_ENV === 'development';
        }
        catch {
            return false;
        }
    }
})();
exports.EMPTY_OBJECT = Object.freeze({});
exports.EMPTY_ARRAY = Object.freeze([]);
const noop = () => { };
exports.noop = noop;
const defaultGetCacheKey = (params) => {
    switch (typeof params) {
        case 'string':
        case 'symbol':
            return params;
        case 'object':
            return JSON.stringify(params);
        default:
            return String(params);
    }
};
exports.defaultGetCacheKey = defaultGetCacheKey;
const applyEntityChanges = (entities, changes, options) => {
    if (changes.merge && changes.entities) {
        (0, exports.logWarn)('applyEntityChanges', 'merge and entities should not be both set');
    }
    const { merge = changes.entities, replace, remove } = changes;
    if (!merge && !replace && !remove) {
        return undefined;
    }
    const mutable = options.mutableCollections;
    const deepEqual = options.deepComparisonEnabled ? exports.optionalUtils.deepEqual : undefined;
    let result;
    const objectWithAllTypenames = { ...merge, ...remove, ...replace };
    for (const typename in objectWithAllTypenames) {
        const entitiesToMerge = merge?.[typename];
        const entitiesToReplace = replace?.[typename];
        const entitiesToRemove = remove?.[typename];
        const entitiesToRemoveLength = entitiesToRemove === undefined
            ? 0
            : Array.isArray(entitiesToRemove)
                ? entitiesToRemove.length
                : entitiesToRemove.size;
        if (!entitiesToMerge && !entitiesToReplace && !entitiesToRemoveLength) {
            continue;
        }
        if (options.additionalValidation) {
            const mergeIds = entitiesToMerge && Object.keys(entitiesToMerge);
            const replaceIds = entitiesToReplace && Object.keys(entitiesToReplace);
            const idsSet = new Set(mergeIds);
            replaceIds?.forEach((id) => idsSet.add(id));
            entitiesToRemove?.forEach((id) => idsSet.add(String(id)));
            const totalKeysInResponse = (mergeIds?.length ?? 0) + (replaceIds?.length ?? 0) + entitiesToRemoveLength;
            if (totalKeysInResponse !== 0 && idsSet.size !== totalKeysInResponse) {
                (0, exports.logWarn)('applyEntityChanges', 'merge, replace and remove changes have intersections for: ' + typename);
            }
        }
        const oldEntities = entities[typename];
        let newEntities;
        entitiesToRemove?.forEach((id) => {
            if (oldEntities?.[id]) {
                newEntities ?? (newEntities = mutable ? oldEntities : { ...oldEntities });
                delete newEntities[id];
            }
        });
        if (entitiesToReplace) {
            for (const id in entitiesToReplace) {
                const newEntity = entitiesToReplace[id];
                if (oldEntities === undefined || !deepEqual?.(oldEntities[id], newEntity)) {
                    newEntities ?? (newEntities = mutable ? (oldEntities ?? {}) : { ...oldEntities });
                    newEntities[id] = newEntity;
                }
            }
        }
        if (entitiesToMerge) {
            for (const id in entitiesToMerge) {
                const oldEntity = oldEntities?.[id];
                const newEntity = oldEntity ? { ...oldEntity, ...entitiesToMerge[id] } : entitiesToMerge[id];
                if (!deepEqual?.(oldEntity, newEntity)) {
                    newEntities ?? (newEntities = mutable ? (oldEntities ?? {}) : { ...oldEntities });
                    newEntities[id] = newEntity;
                }
            }
        }
        if (!newEntities) {
            continue;
        }
        if (mutable) {
            (0, exports.incrementChangeKey)(newEntities);
            if (result === undefined) {
                (0, exports.incrementChangeKey)(entities);
                result = entities;
            }
        }
        else {
            result ?? (result = { ...entities });
        }
        result[typename] = newEntities;
    }
    options.logsEnabled &&
        (0, exports.logDebug)('applyEntityChanges', {
            entities,
            changes,
            options,
            result,
        });
    return result;
};
exports.applyEntityChanges = applyEntityChanges;
const isEmptyObject = (obj) => {
    for (const _ in obj) {
        return false;
    }
    return true;
};
exports.isEmptyObject = isEmptyObject;
const createStateComparer = (fields) => {
    return (x, y) => {
        if (x === y) {
            return true;
        }
        if (x === undefined || y === undefined) {
            return false;
        }
        for (let i = 0; i < fields.length; i += 1) {
            const key = fields[i];
            if (x[key] !== y[key]) {
                return false;
            }
        }
        return true;
    };
};
exports.createStateComparer = createStateComparer;
const isExpired = (expiresAt, now = Date.now()) => {
    return expiresAt != null && expiresAt <= now;
};
exports.isExpired = isExpired;
exports.FetchPolicy = {
    NoCacheOrExpired: (_params, state, _store, now) => {
        return state.result === undefined || (0, exports.isExpired)(state.expiresAt, now);
    },
    Always: () => true,
};
const incrementChangeKey = (mutable) => {
    if (mutable._changeKey === undefined) {
        mutable._changeKey = 0;
    }
    else {
        mutable._changeKey += 1;
    }
};
exports.incrementChangeKey = incrementChangeKey;
