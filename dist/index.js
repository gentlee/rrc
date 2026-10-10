"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = exports.isEmptyObject = exports.FetchPolicy = exports.defaultGetCacheKey = exports.createStateComparer = exports.withTypenames = exports.createCache = void 0;
var createCache_1 = require("./createCache");
Object.defineProperty(exports, "createCache", { enumerable: true, get: function () { return createCache_1.createCache; } });
Object.defineProperty(exports, "withTypenames", { enumerable: true, get: function () { return createCache_1.withTypenames; } });
__exportStar(require("./types"), exports);
var utilsAndConstants_1 = require("./utilsAndConstants");
Object.defineProperty(exports, "createStateComparer", { enumerable: true, get: function () { return utilsAndConstants_1.createStateComparer; } });
Object.defineProperty(exports, "defaultGetCacheKey", { enumerable: true, get: function () { return utilsAndConstants_1.defaultGetCacheKey; } });
Object.defineProperty(exports, "FetchPolicy", { enumerable: true, get: function () { return utilsAndConstants_1.FetchPolicy; } });
Object.defineProperty(exports, "isEmptyObject", { enumerable: true, get: function () { return utilsAndConstants_1.isEmptyObject; } });
Object.defineProperty(exports, "noop", { enumerable: true, get: function () { return utilsAndConstants_1.noop; } });
