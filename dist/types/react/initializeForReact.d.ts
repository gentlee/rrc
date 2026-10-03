import type {
  Cache,
  MutateOptions,
  MutationResult,
  MutationState,
  QueryOptions,
  QueryResult,
  QueryState,
  ReduxStoreLike,
  Typenames,
  UseSelector,
} from '../types'
import {useMutation} from './useMutation'
import {useQuery} from './useQuery'

export type StoreHooks = {
  useStore: () => ReduxStoreLike
  useSelector: UseSelector
}

/**
 * Initializes cache to be used with React, creates hooks. Use after initialization for the store.
 * @param reduxCustomStoreHooks Can be used to override defaut redux hooks, imported from "react-redux" package. Not needed for Zustand.
 */
export declare const initializeForReact: <
  N extends string,
  SK extends string,
  T extends Typenames,
  QP,
  QR,
  MP,
  MR,
>(
  cache: Cache<N, SK, T, QP, QR, MP, MR>,
  reduxCustomStoreHooks?: StoreHooks,
) => {
  hooks: {
    /**
     * Returns memoized object with query and mutate functions, binded to the store. Memoization dependency is the store.
     * @warning Not needed for Zustand, its actions are already binded to the store.
     */
    useClient: () => {
      query: <QK extends keyof QP | keyof QR>(
        options: QueryOptions<T, QP, QR, QK>,
      ) => Promise<QueryResult<QK extends keyof QP & keyof QR ? QR[QK] : never>>
      mutate: <MK extends keyof MP | keyof MR>(
        options: MutateOptions<T, MP, MR, MK>,
      ) => Promise<MutationResult<MK extends keyof MP & keyof MR ? MR[MK] : never>>
    }
    /** Fetches query when params change and subscribes to query state changes (subscription depends on `selectorComparer`). */
    useQuery: <QK extends keyof (QP & QR)>(
      options: Parameters<typeof useQuery<N, SK, T, QP, QR, MP, MR, QK>>[1],
    ) => readonly [
      Omit<
        QueryState<
          T,
          QK extends keyof QP & keyof QR ? QP[QK] : never,
          QK extends keyof QP & keyof QR ? QR[QK] : never
        >,
        'expiresAt'
      >,
      (
        options?: Partial<Pick<QueryOptions<T, QP, QR, QK>, 'params' | 'onlyIfExpired'>> | undefined,
      ) => Promise<
        QueryResult<
          QK extends infer T_1
            ? T_1 extends QK
              ? T_1 extends keyof QP & keyof QR
                ? QR[T_1]
                : never
              : never
            : never
        >
      >,
    ]
    /** Subscribes to provided mutation state and provides mutate function. */
    useMutation: <MK extends keyof (MP & MR)>(
      options: Parameters<typeof useMutation<N, SK, T, QP, QR, MP, MR, MK>>[1],
    ) => readonly [
      (
        params: MK extends keyof MP & keyof MR ? MP[MK] : never,
      ) => Promise<
        MutationResult<
          MK extends infer T_1
            ? T_1 extends MK
              ? T_1 extends keyof MP & keyof MR
                ? MR[T_1]
                : never
              : never
            : never
        >
      >,
      MutationState<
        T,
        MK extends keyof MP & keyof MR ? MP[MK] : never,
        MK extends keyof MP & keyof MR ? MR[MK] : never
      >,
      () => boolean,
    ]
    /** useSelector + selectEntityById. */
    useSelectEntityById: <TN extends keyof T>(
      id: PropertyKey | null | undefined,
      typename: TN,
    ) => T[TN] | undefined
    /**
     * useSelector + selectEntitiesByTypename. Also subscribes to collection's change key if `mutableCollections` enabled.
     * @warning Subscribing to collections should be avoided.
     * */
    useEntitiesByTypename: <TN extends keyof T>(typename: TN) => any
  }
}
