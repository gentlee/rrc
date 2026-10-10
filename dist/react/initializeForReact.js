"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeForReact = void 0;
const react_1 = require("react");
const bindAsyncActions_1 = require("../bindAsyncActions");
const utilsAndConstants_1 = require("../utilsAndConstants");
const useMutation_1 = require("./useMutation");
const useQuery_1 = require("./useQuery");
const initializeForReact = (cache, reduxCustomStoreHooks) => {
    var _a;
    const privateCache = cache;
    const { config: { options, options: { logsEnabled }, }, selectors: { selectEntitiesByTypename, selectEntityById }, } = privateCache;
    privateCache.extensions ?? (privateCache.extensions = {});
    if (privateCache.extensions.react !== undefined) {
        (0, utilsAndConstants_1.logWarn)('initializeForReact', 'Already initialized for React');
    }
    else {
        (_a = privateCache.extensions).react ?? (_a.react = {});
    }
    const reactExtension = privateCache.extensions.react;
    reactExtension.storeHooks ?? (reactExtension.storeHooks = {});
    if (reduxCustomStoreHooks !== undefined) {
        if (privateCache.extensions.zustand) {
            throw new Error(`[initializeForReact] Redux custom hooks can't be provided while cache is already initialized for Zustand`);
        }
        reactExtension.storeHooks.useStore = reduxCustomStoreHooks.useStore;
        reactExtension.storeHooks.useSelector = reduxCustomStoreHooks.useSelector;
        reactExtension.storeHooks.useExternalStore = reduxCustomStoreHooks.useStore;
        logsEnabled && (0, utilsAndConstants_1.logDebug)('initializeForReact', 'Initialized with Redux custom hooks');
    }
    else if (privateCache.extensions.zustand) {
        const { innerStore, externalStore } = privateCache.extensions.zustand;
        reactExtension.storeHooks.useStore = () => innerStore;
        reactExtension.storeHooks.useSelector = externalStore;
        reactExtension.storeHooks.useExternalStore = () => externalStore;
        logsEnabled && (0, utilsAndConstants_1.logDebug)('initializeForReact', 'Initialized with Zustand store hooks');
    }
    else {
        try {
            const useStore = require('react-redux').useStore;
            const useSelector = require('react-redux').useSelector;
            reactExtension.storeHooks.useStore = useStore;
            reactExtension.storeHooks.useSelector = useSelector;
            reactExtension.storeHooks.useExternalStore = useStore;
        }
        catch {
            delete privateCache.extensions.react;
            throw new Error("Custom store hooks haven't beed provided, and react-redux package wasn't found");
        }
        logsEnabled && (0, utilsAndConstants_1.logDebug)('initializeForReact', 'Initialized with react-redux global hooks');
    }
    const storeHooks = reactExtension.storeHooks;
    return {
        hooks: {
            useClient: () => {
                const innerStore = storeHooks.useStore();
                const externalStore = storeHooks.useExternalStore();
                return (0, react_1.useMemo)(() => (0, bindAsyncActions_1.bindAsyncActions)(privateCache, innerStore, externalStore), [externalStore, innerStore]);
            },
            useQuery: (options) => (0, useQuery_1.useQuery)(privateCache, options),
            useMutation: (options) => (0, useMutation_1.useMutation)(privateCache, options),
            useSelectEntityById: (id, typename) => {
                return storeHooks.useSelector((state) => selectEntityById(state, id, typename));
            },
            useEntitiesByTypename: (typename) => {
                if (options.mutableCollections) {
                    storeHooks.useSelector((state) => selectEntitiesByTypename(state, typename)?._changeKey);
                }
                return storeHooks.useSelector((state) => selectEntitiesByTypename(state, typename));
            },
        },
    };
};
exports.initializeForReact = initializeForReact;
