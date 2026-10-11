import {generateTestEntitiesMap} from '../../testing/api/utils'
import {testCaches} from '../../testing/redux/cache'

describe.each(testCaches)('%s', (_, cache) => {
  const {
    reducer,
    actions: {
      clearCache,
      clearMutationState,
      clearQueryState,
      invalidateQuery,
      mergeEntityChanges,
      updateMutationStateAndEntities,
      updateQueryStateAndEntities,
    },
  } = cache

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getInitialState = () => reducer(undefined, {} as any)

  const getFilledState = () => {
    let state = getInitialState()
    state = reducer(state, mergeEntityChanges({merge: generateTestEntitiesMap(2)}))
    state = reducer(state, updateQueryStateAndEntities('getUser', 0, {result: 0, params: 0}))
    state = reducer(state, updateMutationStateAndEntities('updateUser', {result: 0}))
    return state
  }

  test.each([
    ['invalidateQuery', invalidateQuery([])],
    ['clearQueryState', clearQueryState([])],
    ['clearMutationState', clearMutationState([])],
  ])('%s with empty array returns the same state', (_, action) => {
    const state = getFilledState()

    expect(reducer(state, action)).toBe(state)
  })

  test('clearCache returns initial state', () => {
    expect(reducer(getFilledState(), clearCache())).toStrictEqual(getInitialState())
  })

  test('clearCache keeps provided parts of the state', () => {
    const state = getFilledState()

    const result = reducer(state, clearCache({entities: state.entities}))

    expect(result).toStrictEqual({...getInitialState(), entities: state.entities})
    expect(result.entities).toBe(state.entities)
  })

  test('unknown action returns the same state', () => {
    const state = getFilledState()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(reducer(state, {type: 'unknown'} as any)).toBe(state)
  })
})
