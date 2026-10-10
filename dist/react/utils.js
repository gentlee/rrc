"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStoreHooks = void 0;
const utilsAndConstants_1 = require("../utilsAndConstants");
const validateStoreHooks = (extensions) => {
    if (extensions?.react?.storeHooks === undefined) {
        throw new Error(`@${utilsAndConstants_1.PACKAGE_SHORT_NAME} Cache wasn't initialized for react. Check initializeForReact function.`);
    }
};
exports.validateStoreHooks = validateStoreHooks;
