import type { CacheOptions, EntitiesMap, EntityChanges, Mutable, QueryState, QueryStateComparer, Typenames } from './types';
export declare const PACKAGE_SHORT_NAME = "rrc";
export declare const optionalUtils: {
    deepEqual?: (a: any, b: any) => boolean;
};
export declare const logDebug: (tag: string, data?: unknown) => void;
export declare const logWarn: (tag: string, data?: unknown) => void;
export declare const IS_DEV: boolean;
export declare const EMPTY_OBJECT: Readonly<{}>;
export declare const EMPTY_ARRAY: readonly never[];
/** Empty function. */
export declare const noop: () => void;
/** Default getCacheKey implementation. */
export declare const defaultGetCacheKey: <P = unknown>(params: P) => PropertyKey;
export declare const applyEntityChanges: <T extends Typenames>(entities: EntitiesMap<T> & Mutable, changes: EntityChanges<T>, options: CacheOptions) => EntitiesMap<T> | undefined;
/** Returns true if object has no keys. */
export declare const isEmptyObject: (obj: object) => boolean;
/** Returns query state comparer that compares only provided fields. Used in implementation of `selectorComparer` option. */
export declare const createStateComparer: <T extends Typenames = Typenames, Q = unknown, P = unknown>(fields: (keyof QueryState<T, Q, P>)[]) => QueryStateComparer<T, Q, P>;
export declare const FetchPolicy: {
    /**
     * Only if cache does not exist (result is undefined) or expired. Default.
     * @param expired `true` when `expiresAt` is defined and lower than `Date.now()`
     */
    NoCacheOrExpired: <T extends Typenames = Typenames, P = unknown, R = unknown>(expired: boolean, _params: P, state: QueryState<T, P, R>) => boolean;
    /** Every fetch trigger. */
    Always: () => boolean;
};
export declare const incrementChangeKey: (mutable: Mutable) => void;
