import type {
  CacheOptions,
  EntitiesMap,
  EntityChanges,
  Mutable,
  QueryState,
  QueryStateComparer,
  Typenames,
} from './types'

export const PACKAGE_SHORT_NAME = 'rrc'

export const optionalUtils: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deepEqual?: (a: any, b: any) => boolean
} = {
  deepEqual: undefined,
}

export const logDebug = (tag: string, data?: unknown) => {
  console.debug(`@${PACKAGE_SHORT_NAME} [${tag}]`, data)
}

export const logWarn = (tag: string, data?: unknown) => {
  console.warn(`@${PACKAGE_SHORT_NAME} [${tag}]`, data)
}

try {
  optionalUtils.deepEqual = require('fast-deep-equal/es6')
} catch {
  logDebug('deepEqual', 'fast-deep-equal optional dependency was not installed')
}

export const IS_DEV: boolean = (() => {
  try {
    // @ts-expect-error __DEV__ is only for React Native
    return __DEV__
  } catch {
    return process.env.NODE_ENV === 'development'
  }
})()

export const EMPTY_OBJECT = Object.freeze({})

export const EMPTY_ARRAY = Object.freeze([])

/** Empty function. */
export const noop = () => {}

/** Default getCacheKey implementation. */
export const defaultGetCacheKey = <P = unknown>(params: P): PropertyKey => {
  switch (typeof params) {
    case 'string':
    case 'symbol':
      return params
    case 'object':
      return JSON.stringify(params)
    default:
      return String(params)
  }
}

export const applyEntityChanges = <T extends Typenames>(
  entities: EntitiesMap<T> & Mutable,
  changes: EntityChanges<T>,
  options: CacheOptions,
): EntitiesMap<T> | undefined => {
  if (changes.merge && changes.entities) {
    logWarn('applyEntityChanges', 'merge and entities should not be both set')
  }

  const {merge = changes.entities, replace, remove} = changes

  if (!merge && !replace && !remove) {
    return undefined
  }

  const mutable = options.mutableCollections
  const deepEqual = options.deepComparisonEnabled ? optionalUtils.deepEqual : undefined

  let result: EntitiesMap<T> | undefined

  const objectWithAllTypenames = {...merge, ...remove, ...replace}
  for (const typename in objectWithAllTypenames) {
    const entitiesToMerge = merge?.[typename]
    const entitiesToReplace = replace?.[typename]
    const entitiesToRemove = remove?.[typename]
    const entitiesToRemoveLength =
      entitiesToRemove === undefined
        ? 0
        : Array.isArray(entitiesToRemove)
          ? entitiesToRemove.length
          : entitiesToRemove.size

    if (!entitiesToMerge && !entitiesToReplace && !entitiesToRemoveLength) {
      continue
    }

    // check for key intersection
    if (options.additionalValidation) {
      const mergeIds = entitiesToMerge && Object.keys(entitiesToMerge)
      const replaceIds = entitiesToReplace && Object.keys(entitiesToReplace)

      const idsSet = new Set<string>(mergeIds)
      replaceIds?.forEach((id) => idsSet.add(id))
      entitiesToRemove?.forEach((id) => idsSet.add(String(id)))

      const totalKeysInResponse = (mergeIds?.length ?? 0) + (replaceIds?.length ?? 0) + entitiesToRemoveLength
      if (totalKeysInResponse !== 0 && idsSet.size !== totalKeysInResponse) {
        logWarn('applyEntityChanges', 'merge, replace and remove changes have intersections for: ' + typename)
      }
    }

    const oldEntities = entities[typename]
    let newEntities: EntitiesMap<T>[typeof typename] | undefined

    // remove
    entitiesToRemove?.forEach((id) => {
      if (oldEntities?.[id]) {
        newEntities ??= mutable ? oldEntities : {...oldEntities}
        delete newEntities![id]
      }
    })

    // replace
    if (entitiesToReplace) {
      for (const id in entitiesToReplace) {
        const newEntity = entitiesToReplace[id]
        if (oldEntities === undefined || !deepEqual?.(oldEntities[id], newEntity)) {
          newEntities ??= mutable ? (oldEntities ?? {}) : {...oldEntities}
          newEntities[id] = newEntity
        }
      }
    }

    // merge
    if (entitiesToMerge) {
      for (const id in entitiesToMerge) {
        const oldEntity = oldEntities?.[id]
        const newEntity = oldEntity ? {...oldEntity, ...entitiesToMerge[id]} : entitiesToMerge[id]
        if (!deepEqual?.(oldEntity, newEntity)) {
          newEntities ??= mutable ? (oldEntities ?? {}) : {...oldEntities}
          // @ts-expect-error Warning: partial entity possible in the new state after merge
          newEntities[id] = newEntity
        }
      }
    }

    if (!newEntities) {
      continue
    }

    if (mutable) {
      incrementChangeKey(newEntities)

      if (result === undefined) {
        incrementChangeKey(entities)
        result = entities
      }
    } else {
      result ??= {...entities}
    }

    // @ts-expect-error fix later
    result[typename] = newEntities
  }

  options.logsEnabled &&
    logDebug('applyEntityChanges', {
      entities,
      changes,
      options,
      result,
    })

  return result
}

/** Returns true if object has no keys. */
export const isEmptyObject = (obj: object) => {
  for (const _ in obj) {
    return false
  }
  return true
}

/** Returns query state comparer that compares only provided fields. Used in implementation of `selectorComparer` option. */
export const createStateComparer = <T extends Typenames = Typenames, Q = unknown, P = unknown>(
  fields: (keyof QueryState<T, Q, P>)[],
): QueryStateComparer<T, Q, P> => {
  return (x: QueryState<T, Q, P> | undefined, y: QueryState<T, Q, P> | undefined) => {
    if (x === y) {
      return true
    }
    if (x === undefined || y === undefined) {
      return false
    }
    for (let i = 0; i < fields.length; i += 1) {
      const key = fields[i]
      if (x[key] !== y[key]) {
        return false
      }
    }
    return true
  }
}

// doc-header FetchPolicy
export const FetchPolicy = {
  /**
   * Only if cache does not exist (result is undefined) or expired. Default.
   * @param expired `true` when `expiresAt` is defined and lower than `Date.now()`
   */
  NoCacheOrExpired: <T extends Typenames = Typenames, P = unknown, R = unknown>(
    expired: boolean,
    _params: P,
    state: QueryState<T, P, R>,
  ) => {
    return expired || state.result === undefined
  },
  /** Every fetch trigger. */
  Always: () => true,
}

export const incrementChangeKey = (mutable: Mutable) => {
  if (mutable._changeKey === undefined) {
    mutable._changeKey = 0
  } else {
    mutable._changeKey += 1
  }
}
