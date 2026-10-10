"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutate = void 0;
const utilsAndConstants_1 = require("./utilsAndConstants");
const mutate = async (logTag, innerStore, externalStore, { config: { mutations, options, globals }, actions: { updateMutationStateAndEntities }, abortControllers, }, mutationKey, params, onCompleted = mutations[mutationKey].onCompleted, onSuccess = mutations[mutationKey].onSuccess, onError = mutations[mutationKey].onError) => {
    let abortControllersOfStore = abortControllers.get(innerStore);
    if (abortControllersOfStore === undefined) {
        abortControllersOfStore = {};
        abortControllers.set(innerStore, abortControllersOfStore);
    }
    {
        const abortController = abortControllersOfStore[mutationKey];
        options.logsEnabled &&
            (0, utilsAndConstants_1.logDebug)(logTag, { mutationKey, params, previousAborted: abortController !== undefined });
        if (abortController !== undefined) {
            abortController.abort();
        }
    }
    const abortController = new AbortController();
    abortControllersOfStore[mutationKey] = abortController;
    let mutatePromise;
    let response;
    let error;
    try {
        mutatePromise = mutations[mutationKey].mutation(params, externalStore, abortController.signal);
    }
    catch (e) {
        error = e;
    }
    if (!error) {
        innerStore.dispatch(updateMutationStateAndEntities(mutationKey, {
            loading: mutatePromise,
            params,
            result: undefined,
            error,
        }));
        try {
            response = await mutatePromise;
        }
        catch (e) {
            error = e;
        }
    }
    options.logsEnabled &&
        (0, utilsAndConstants_1.logDebug)(`${logTag} finished`, { response, error, aborted: abortController.signal.aborted });
    if (abortController.signal.aborted) {
        if (abortControllersOfStore[mutationKey] === abortController) {
            delete abortControllersOfStore[mutationKey];
        }
        return ABORTED_RESULT;
    }
    delete abortControllersOfStore[mutationKey];
    if (error) {
        innerStore.dispatch(updateMutationStateAndEntities(mutationKey, {
            params,
            error,
            loading: undefined,
        }));
        if (!onError?.(error, params, externalStore)) {
            globals.onError?.(error, mutationKey, params, externalStore);
        }
        onCompleted?.(response, error, params, externalStore);
        return { error };
    }
    if (response) {
        const newState = {
            error: undefined,
            loading: undefined,
            result: response.result,
        };
        innerStore.dispatch(updateMutationStateAndEntities(mutationKey, newState, response));
        onSuccess?.(response, params, externalStore);
        onCompleted?.(response, error, params, externalStore);
        return { result: response.result };
    }
    throw new Error(`${logTag}: both error and response are not defined`);
};
exports.mutate = mutate;
const ABORTED_RESULT = Object.freeze({ aborted: true });
