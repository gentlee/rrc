"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStoreHooks = void 0;
const utilsAndConstants_1 = require("../utilsAndConstants");
const validateStoreHooks = (extensions) => {
    var _a;
    if (((_a = extensions === null || extensions === void 0 ? void 0 : extensions.react) === null || _a === void 0 ? void 0 : _a.storeHooks) === undefined) {
        throw new Error(`@${utilsAndConstants_1.PACKAGE_SHORT_NAME} Cache wasn't initialized for react. Check initializeForReact function.`);
    }
};
exports.validateStoreHooks = validateStoreHooks;
