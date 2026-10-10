import type { Actions } from './createActions';
import type { CacheOptions, CacheState, Typenames } from './types';
export declare const createReducer: <N extends string, T extends Typenames, QP, QR, MP, MR>(actions: Actions<N, T, QP, QR, MP, MR>, queryKeys: (keyof (QP | QR))[], cacheOptions: CacheOptions) => (state: CacheState<T, QP, QR, MP, MR> | undefined, action: ReturnType<(typeof actions)[keyof typeof actions]>) => CacheState<T, QP, QR, MP, MR>;
