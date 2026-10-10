"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMutation = void 0;
const react_1 = require("react");
const mutate_1 = require("../mutate");
const utilsAndConstants_1 = require("../utilsAndConstants");
const utils_1 = require("./utils");
const useMutation = (cache, options) => {
    const { config, extensions } = cache;
    const { mutation: mutationKey, onCompleted, onSuccess, onError } = options;
    (0, utils_1.validateStoreHooks)(extensions);
    const { useStore, useExternalStore, useSelector } = extensions.react.storeHooks;
    const innerStore = useStore();
    const externalStore = useExternalStore();
    const mutate = (0, react_1.useCallback)(async (params) => {
        return (0, mutate_1.mutate)('useMutation.mutate', innerStore, externalStore, cache, mutationKey, params, onCompleted, onSuccess, onError);
    }, [mutationKey, innerStore, externalStore, onCompleted, onSuccess, onError]);
    const [mutationStateSelector, abort] = (0, react_1.useMemo)(() => {
        const mutationStateSelectorFromUseMutation = (state) => cache.selectors.selectMutationState(state, mutationKey);
        const abortFromUseMutation = () => {
            const abortController = cache.abortControllers.get(innerStore)?.[mutationKey];
            if (abortController === undefined || abortController.signal.aborted) {
                return false;
            }
            abortController.abort();
            innerStore.dispatch(cache.actions.updateMutationStateAndEntities(mutationKey, { loading: undefined }));
            return true;
        };
        return [mutationStateSelectorFromUseMutation, abortFromUseMutation];
    }, [mutationKey, innerStore]);
    const mutationState = useSelector(mutationStateSelector) ?? utilsAndConstants_1.EMPTY_OBJECT;
    config.options.logsEnabled && (0, utilsAndConstants_1.logDebug)('useMutation', { options, mutationState });
    return [mutate, mutationState, abort];
};
exports.useMutation = useMutation;
