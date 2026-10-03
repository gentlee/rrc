import type {AnyStore, QueryResult, Typenames} from './types'
import {CachePrivate, InnerStore} from './typesPrivate'

export declare const query: <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
  QK extends keyof (QP & QR),
>(
  logTag: string,
  innerStore: InnerStore,
  externalStore: AnyStore,
  cache: Pick<CachePrivate<N, SK, T, QP, QR, MP, MR>, 'config' | 'actions' | 'selectors'>,
  queryKey: QK,
  cacheKey: PropertyKey,
  params: QK extends keyof (QP | QR) ? QP[QK] : never,
  onlyIfExpired: boolean | undefined,
  skipFetch: boolean | undefined,
  secondsToLive?: number | undefined,
  mergeResults?:
    | ((
        oldResult: QR[keyof QP & keyof QR & string] | undefined,
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & string]>,
        params: QP[keyof QP & keyof QR & string] | undefined,
        store: AnyStore,
      ) => QR[keyof QP & keyof QR & string])
    | ((
        oldResult: QR[keyof QP & keyof QR & number] | undefined,
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & number]>,
        params: QP[keyof QP & keyof QR & number] | undefined,
        store: AnyStore,
      ) => QR[keyof QP & keyof QR & number])
    | ((
        oldResult: QR[keyof QP & keyof QR & symbol] | undefined,
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & symbol]>,
        params: QP[keyof QP & keyof QR & symbol] | undefined,
        store: AnyStore,
      ) => QR[keyof QP & keyof QR & symbol])
    | undefined,
  onCompleted?:
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & string]> | undefined,
        error: unknown | undefined,
        params: QP[keyof QP & keyof QR & string],
        store: AnyStore,
      ) => void)
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & number]> | undefined,
        error: unknown | undefined,
        params: QP[keyof QP & keyof QR & number],
        store: AnyStore,
      ) => void)
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & symbol]> | undefined,
        error: unknown | undefined,
        params: QP[keyof QP & keyof QR & symbol],
        store: AnyStore,
      ) => void)
    | undefined,
  onSuccess?:
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & string]>,
        params: QP[keyof QP & keyof QR & string],
        store: AnyStore,
      ) => void)
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & number]>,
        params: QP[keyof QP & keyof QR & number],
        store: AnyStore,
      ) => void)
    | ((
        response: import('./types').NormalizedQueryResponse<T, QR[keyof QP & keyof QR & symbol]>,
        params: QP[keyof QP & keyof QR & symbol],
        store: AnyStore,
      ) => void)
    | undefined,
  onError?:
    | ((
        error: unknown,
        params: QP[keyof QP & keyof QR & string],
        store: AnyStore,
      ) => boolean | void | null | undefined)
    | ((
        error: unknown,
        params: QP[keyof QP & keyof QR & number],
        store: AnyStore,
      ) => boolean | void | null | undefined)
    | ((
        error: unknown,
        params: QP[keyof QP & keyof QR & symbol],
        store: AnyStore,
      ) => boolean | void | null | undefined)
    | undefined,
) => Promise<QueryResult<QK extends keyof (QP | QR) ? QR[QK] : never>>
