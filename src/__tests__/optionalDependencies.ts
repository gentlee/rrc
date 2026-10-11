import {consoleWarnSpy} from '../testing/setup'

type Item = {id: number; name: string}

const OPTIONAL_PACKAGES = ['fast-deep-equal/es6', 'react-redux']

/**
 * Loads fresh copies of the library modules, with the provided package failing to load as if it was not installed.
 * The package stays unavailable until the end of the test, because it can be required lazily.
 */
const loadWithoutPackage = <R>(packageName: string, load: () => R): R => {
  let result: R
  jest.isolateModules(() => {
    jest.doMock(packageName, () => {
      throw new Error(`Cannot find module '${packageName}'`)
    })
    result = load()
  })
  return result!
}

afterEach(() => {
  OPTIONAL_PACKAGES.forEach((packageName) => jest.dontMock(packageName))
})

describe('without fast-deep-equal', () => {
  const load = () =>
    loadWithoutPackage('fast-deep-equal/es6', () => ({
      ...(require('../utilsAndConstants') as typeof import('../utilsAndConstants')),
      ...(require('../createCache') as typeof import('../createCache')),
      ...(require('../redux') as typeof import('../redux')),
    }))

  let debugSpy: jest.SpyInstance

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    debugSpy.mockRestore()
  })

  test('deep comparison is not available and it is logged', () => {
    const {optionalUtils} = load()

    expect(optionalUtils.deepEqual).toBeUndefined()
    expect(debugSpy.mock.calls).toStrictEqual([
      ['@rrc [deepEqual]', 'fast-deep-equal optional dependency was not installed'],
    ])
  })

  test('createCache warns only when deep comparison is enabled', () => {
    const {createCache} = load()

    createCache({name: 'cache', cacheStateKey: 'cache', options: {deepComparisonEnabled: false}})
    expect(consoleWarnSpy).not.toHaveBeenCalled()

    createCache({name: 'cache', cacheStateKey: 'cache'})
    expect(consoleWarnSpy.mock.calls).toStrictEqual([
      [
        '@rrc [createCache]',
        'optional dependency for fast-deep-equal was not provided, while deepComparisonEnabled option is true',
      ],
    ])
    consoleWarnSpy.mockClear()
  })

  test.each([false, true])(
    'cache works without deep comparison (mutableCollections: %s)',
    (mutableCollections) => {
      const {withTypenames, initializeForRedux} = load()
      const cache = withTypenames<{items: Item}>().createCache({
        name: 'cache',
        cacheStateKey: '.',
        options: {mutableCollections},
        queries: {getItem: {query: async (id: number) => ({result: id})}},
      })
      consoleWarnSpy.mockClear()
      const {reducer, actions} = initializeForRedux(cache)
      const item = {id: 1, name: 'one'}

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let state = reducer(undefined, {} as any)
      state = reducer(state, actions.mergeEntityChanges({merge: {items: {1: item}}}))
      state = reducer(state, actions.updateQueryStateAndEntities('getItem', 1, {result: 1, params: 1}))
      const stateBefore = {...state}
      const queryStateBefore = state.queries.getItem[1]

      // Without deep comparison equal values are always written as new objects.
      state = reducer(state, actions.mergeEntityChanges({merge: {items: {1: {name: 'one'}}}}))
      state = reducer(state, actions.updateQueryStateAndEntities('getItem', 1, {result: 1, params: 1}))

      expect(state).not.toBe(stateBefore)
      expect(state.entities.items![1]).toStrictEqual(item)
      expect(state.entities.items![1]).not.toBe(item)
      expect(state.queries.getItem[1]).toStrictEqual({result: 1, params: 1})
      expect(state.queries.getItem[1]).not.toBe(queryStateBefore)
    },
  )
})

describe('without react-redux', () => {
  const load = () =>
    loadWithoutPackage('react-redux', () => ({
      ...(require('../createCache') as typeof import('../createCache')),
      ...(require('../react') as typeof import('../react')),
      ...(require('../redux') as typeof import('../redux')),
    }))

  test('initializeForReact throws when custom store hooks are not provided', () => {
    const {createCache, initializeForRedux, initializeForReact} = load()
    const cache = createCache({name: 'cache', cacheStateKey: 'cache'})
    initializeForRedux(cache)

    expect(() => initializeForReact(cache)).toThrow(
      "Custom store hooks haven't been provided, and react-redux package wasn't found",
    )

    // Failed initialization does not leave the cache initialized for React.
    expect('extensions' in cache ? cache.extensions : undefined).toStrictEqual({})
  })

  test('initializeForReact works with custom store hooks', () => {
    const {createCache, initializeForRedux, initializeForReact} = load()
    const cache = createCache({name: 'cache', cacheStateKey: 'cache'})
    initializeForRedux(cache)

    const {hooks} = initializeForReact(cache, {useStore: jest.fn(), useSelector: jest.fn()})

    expect(hooks.useQuery).toEqual(expect.any(Function))
  })

  test('initializeForReact can be called again with custom store hooks after it failed', () => {
    const {createCache, initializeForRedux, initializeForReact} = load()
    const cache = createCache({name: 'cache', cacheStateKey: 'cache'})
    initializeForRedux(cache)
    expect(() => initializeForReact(cache)).toThrow()

    initializeForReact(cache, {useStore: jest.fn(), useSelector: jest.fn()})

    // No warning about double initialization.
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})
