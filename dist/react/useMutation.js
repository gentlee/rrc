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
exports.useMutation = void 0;
const react_1 = require("react");
const mutate_1 = require("../mutate");
const utilsAndConstants_1 = require("../utilsAndConstants");
const utils_1 = require("./utils");
const useMutation = (cache, options) => {
    var _a;
    const { config, extensions } = cache;
    const { mutation: mutationKey, onCompleted, onSuccess, onError } = options;
    (0, utils_1.validateStoreHooks)(extensions);
    const { useStore, useExternalStore, useSelector } = extensions.react.storeHooks;
    const innerStore = useStore();
    const externalStore = useExternalStore();
    const mutate = (0, react_1.useCallback)((params) => __awaiter(void 0, void 0, void 0, function* () {
        return (0, mutate_1.mutate)('useMutation.mutate', innerStore, externalStore, cache, mutationKey, params, onCompleted, onSuccess, onError);
    }), [mutationKey, innerStore, externalStore, onCompleted, onSuccess, onError]);
    const [mutationStateSelector, abort] = (0, react_1.useMemo)(() => {
        const mutationStateSelectorFromUseMutation = (state) => cache.selectors.selectMutationState(state, mutationKey);
        const abortFromUseMutation = () => {
            var _a;
            const abortController = (_a = cache.abortControllers.get(innerStore)) === null || _a === void 0 ? void 0 : _a[mutationKey];
            if (abortController === undefined || abortController.signal.aborted) {
                return false;
            }
            abortController.abort();
            innerStore.dispatch(cache.actions.updateMutationStateAndEntities(mutationKey, { loading: undefined }));
            return true;
        };
        return [mutationStateSelectorFromUseMutation, abortFromUseMutation];
    }, [mutationKey, innerStore]);
    const mutationState = (_a = useSelector(mutationStateSelector)) !== null && _a !== void 0 ? _a : utilsAndConstants_1.EMPTY_OBJECT;
    config.options.logsEnabled && (0, utilsAndConstants_1.logDebug)('useMutation', { options, mutationState });
    return [mutate, mutationState, abort];
};
exports.useMutation = useMutation;
