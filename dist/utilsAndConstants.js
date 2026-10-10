"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementChangeKey = exports.FetchPolicy = exports.createStateComparer = exports.isEmptyObject = exports.applyEntityChanges = exports.defaultGetCacheKey = exports.noop = exports.EMPTY_ARRAY = exports.EMPTY_OBJECT = exports.IS_DEV = exports.logWarn = exports.logDebug = exports.optionalUtils = exports.PACKAGE_SHORT_NAME = void 0;
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
catch (_a) {
    (0, exports.logDebug)('deepEqual', 'fast-deep-equal optional dependency was not installed');
}
exports.IS_DEV = (() => {
    try {
        return __DEV__;
    }
    catch (_a) {
        return process.env.NODE_ENV === 'development';
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
    var _a, _b;
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
    const objectWithAllTypenames = Object.assign(Object.assign(Object.assign({}, merge), remove), replace);
    for (const typename in objectWithAllTypenames) {
        const entitiesToMerge = merge === null || merge === void 0 ? void 0 : merge[typename];
        const entitiesToReplace = replace === null || replace === void 0 ? void 0 : replace[typename];
        const entitiesToRemove = remove === null || remove === void 0 ? void 0 : remove[typename];
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
            replaceIds === null || replaceIds === void 0 ? void 0 : replaceIds.forEach((id) => idsSet.add(id));
            entitiesToRemove === null || entitiesToRemove === void 0 ? void 0 : entitiesToRemove.forEach((id) => idsSet.add(String(id)));
            const totalKeysInResponse = ((_a = mergeIds === null || mergeIds === void 0 ? void 0 : mergeIds.length) !== null && _a !== void 0 ? _a : 0) + ((_b = replaceIds === null || replaceIds === void 0 ? void 0 : replaceIds.length) !== null && _b !== void 0 ? _b : 0) + entitiesToRemoveLength;
            if (totalKeysInResponse !== 0 && idsSet.size !== totalKeysInResponse) {
                (0, exports.logWarn)('applyEntityChanges', 'merge, replace and remove changes have intersections for: ' + typename);
            }
        }
        const oldEntities = entities[typename];
        let newEntities;
        entitiesToRemove === null || entitiesToRemove === void 0 ? void 0 : entitiesToRemove.forEach((id) => {
            if (oldEntities === null || oldEntities === void 0 ? void 0 : oldEntities[id]) {
                newEntities !== null && newEntities !== void 0 ? newEntities : (newEntities = mutable ? oldEntities : Object.assign({}, oldEntities));
                delete newEntities[id];
            }
        });
        if (entitiesToReplace) {
            for (const id in entitiesToReplace) {
                const newEntity = entitiesToReplace[id];
                if (oldEntities === undefined || !(deepEqual === null || deepEqual === void 0 ? void 0 : deepEqual(oldEntities[id], newEntity))) {
                    newEntities !== null && newEntities !== void 0 ? newEntities : (newEntities = mutable ? (oldEntities !== null && oldEntities !== void 0 ? oldEntities : {}) : Object.assign({}, oldEntities));
                    newEntities[id] = newEntity;
                }
            }
        }
        if (entitiesToMerge) {
            for (const id in entitiesToMerge) {
                const oldEntity = oldEntities === null || oldEntities === void 0 ? void 0 : oldEntities[id];
                const newEntity = oldEntity ? Object.assign(Object.assign({}, oldEntity), entitiesToMerge[id]) : entitiesToMerge[id];
                if (!(deepEqual === null || deepEqual === void 0 ? void 0 : deepEqual(oldEntity, newEntity))) {
                    newEntities !== null && newEntities !== void 0 ? newEntities : (newEntities = mutable ? (oldEntities !== null && oldEntities !== void 0 ? oldEntities : {}) : Object.assign({}, oldEntities));
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
            result !== null && result !== void 0 ? result : (result = Object.assign({}, entities));
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
exports.FetchPolicy = {
    NoCacheOrExpired: (expired, _params, state) => {
        return expired || state.result === undefined;
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
