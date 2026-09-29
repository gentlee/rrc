import {generateTestBank, generateTestEntitiesMap, generateTestUser} from '../../testing/api/utils'
import {testCaches, TestTypenames} from '../../testing/redux/cache'
import {consoleWarnSpy} from '../../testing/setup'
import {EntityChanges} from '../../types'

describe.each(testCaches)('%s', (_, cache, withChangeKey) => {
  const {
    config: {
      options: {mutableCollections},
    },
    utils: {applyEntityChanges},
  } = cache

  test.each(['merge', 'entities'] as const)('add new entities via %s', (field) => {
    const entitiesMap = generateTestEntitiesMap(0)
    const changes: EntityChanges<TestTypenames> = {
      [field]: generateTestEntitiesMap(2),
    }

    const result = applyEntityChanges(entitiesMap, changes)

    expect(result).toStrictEqual(
      withChangeKey(0, generateTestEntitiesMap(2, true, mutableCollections ? 0 : undefined)),
    )
  })

  test('remove entities', () => {
    const entitiesMap = generateTestEntitiesMap(2)
    const changes: EntityChanges<TestTypenames> = {
      remove: {
        users: [0],
        banks: ['0'],
      },
    }

    const result = applyEntityChanges(entitiesMap, changes)

    expect(result).toStrictEqual(
      withChangeKey(0, {
        users: withChangeKey(0, {
          1: generateTestUser(1),
        }),
        banks: withChangeKey(0, {
          1: generateTestBank('1'),
        }),
      }),
    )
  })

  test.each(['merge', 'entities'] as const)('update entities via %s', (field) => {
    const entitiesMap = generateTestEntitiesMap(2)
    const changes: EntityChanges<TestTypenames> = {
      [field]: {
        users: {1: {name: 'User 1 updated'}},
        banks: {1: {name: 'Bank 1 updated'}},
      },
    }

    const result = applyEntityChanges(entitiesMap, changes)

    expect(result).toStrictEqual(
      withChangeKey(0, {
        users: withChangeKey(0, {
          0: generateTestUser(0),
          1: generateTestUser(1, true, ' updated'),
        }),
        banks: withChangeKey(0, {
          0: generateTestBank('0'),
          1: generateTestBank('1', ' updated'),
        }),
      }),
    )
  })

  test('replace entities', () => {
    const entitiesMap = generateTestEntitiesMap(2)
    const changes: EntityChanges<TestTypenames> = {
      replace: {
        users: {1: generateTestUser(1, false)},
        banks: {1: generateTestBank('1', ' replaced')},
      },
    }

    const result = applyEntityChanges(entitiesMap, changes)

    expect(result).toStrictEqual(
      withChangeKey(0, {
        users: withChangeKey(0, {
          0: generateTestUser(0),
          1: generateTestUser(1, false),
        }),
        banks: withChangeKey(0, {
          0: generateTestBank('0'),
          1: generateTestBank('1', ' replaced'),
        }),
      }),
    )
  })

  test.each(['merge', 'entities'] as const)('add, remove, update and replace entities via %s', (field) => {
    const entitiesMap = generateTestEntitiesMap(3)
    const changes: EntityChanges<TestTypenames> = {
      [field]: {
        users: {1: generateTestUser(1, true, ' updated')},
        banks: {
          1: generateTestBank('1', ' updated'),
          3: generateTestBank('3'),
        },
      },
      replace: {
        users: {2: generateTestUser(2, false)},
        banks: {2: generateTestBank('2', ' replaced')},
      },
      remove: {
        users: [0],
        banks: ['0'],
      },
    }

    const result = applyEntityChanges(entitiesMap, changes)

    expect(result).toStrictEqual(
      withChangeKey(0, {
        users: withChangeKey(0, {
          1: generateTestUser(1, true, ' updated'),
          2: generateTestUser(2, false),
        }),
        banks: withChangeKey(0, {
          1: generateTestBank('1', ' updated'),
          2: generateTestBank('2', ' replaced'),
          3: generateTestBank('3'),
        }),
      }),
    )
  })

  test('return undefined with empty arguments', () => {
    const entitiesMap = generateTestEntitiesMap(1)
    const changes: EntityChanges<TestTypenames> = {}
    const changes2: EntityChanges<TestTypenames> = {
      merge: {},
      remove: {},
      replace: {},
    }
    const changes3: EntityChanges<TestTypenames> = {
      remove: {
        banks: [],
        users: [],
      },
    }

    const result = applyEntityChanges(entitiesMap, changes)
    const result2 = applyEntityChanges(entitiesMap, changes2)
    const result3 = applyEntityChanges(entitiesMap, changes3)

    expect(result).toBe(undefined)
    expect(result2).toBe(undefined)
    expect(result3).toBe(undefined)
  })

  test('warn if merge and entities both set', () => {
    const entitiesMap = generateTestEntitiesMap(1)
    const changes: EntityChanges<TestTypenames> = {
      merge: {
        users: {0: generateTestUser(0)},
      },
      entities: {
        users: {1: generateTestUser(1)},
      },
    }

    applyEntityChanges(entitiesMap, changes)

    expect(consoleWarnSpy.mock.calls).toStrictEqual([
      ['@rrc [applyEntityChanges]', 'merge and entities should not be both set'],
    ])
    consoleWarnSpy.mockClear()
  })

  test('warn if merge, replace or remove have intersections', () => {
    const entitiesMap = generateTestEntitiesMap(1)
    const changes: EntityChanges<TestTypenames> = {
      merge: {
        users: {0: generateTestUser(0)},
      },
      replace: {
        users: {0: generateTestUser(0)},
      },
    }
    const changes2: EntityChanges<TestTypenames> = {
      merge: {
        users: {0: generateTestUser(0)},
      },
      remove: {users: [0]},
    }
    const changes3: EntityChanges<TestTypenames> = {
      merge: generateTestEntitiesMap(2),
      replace: generateTestEntitiesMap(2),
      remove: {banks: [0]},
    }

    ;[changes, changes2, changes3].forEach((changes) => {
      applyEntityChanges(entitiesMap, changes)
    })
    expect(consoleWarnSpy.mock.calls).toStrictEqual([
      ['@rrc [applyEntityChanges]', 'merge, replace and remove changes have intersections for: users'],
      ['@rrc [applyEntityChanges]', 'merge, replace and remove changes have intersections for: users'],
      ['@rrc [applyEntityChanges]', 'merge, replace and remove changes have intersections for: users'],
      ['@rrc [applyEntityChanges]', 'merge, replace and remove changes have intersections for: banks'],
    ])
    consoleWarnSpy.mockClear()
  })
})
