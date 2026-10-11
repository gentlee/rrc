import {withTypenames} from '../../createCache'

type Item = {id: number; name: string; tags: string[]; meta?: {level: number}; note?: string}

type Typenames = {items: Item}

const createItems = () => ({
  1: {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 1}},
  2: {id: 2, name: 'two', tags: []},
})

describe.each([false, true])('merge with mutableCollections: %s', (mutableCollections) => {
  const createUtils = (deepComparisonEnabled = true) =>
    withTypenames<Typenames>().createCache({
      name: 'cache',
      cacheStateKey: 'cache',
      options: {mutableCollections, deepComparisonEnabled},
    }).utils

  const {applyEntityChanges} = createUtils()

  test.each([
    ['same primitive field', {name: 'one'}],
    ['deeply equal array and object', {tags: ['a', 'b'], meta: {level: 1}}],
    ['all fields', {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 1}}],
    ['no fields', {}],
  ])('does not change anything when merging %s', (_, partial) => {
    const items = createItems()
    const item = items[1]

    const result = applyEntityChanges({items}, {merge: {items: {1: partial}}})

    expect(result).toBeUndefined()
    expect(items[1]).toBe(item)
    expect(items).toStrictEqual(createItems())
  })

  test.each([
    ['primitive field', {name: 'ONE'}, {id: 1, name: 'ONE', tags: ['a', 'b'], meta: {level: 1}}],
    ['nested value', {meta: {level: 2}}, {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 2}}],
    ['array length', {tags: ['a']}, {id: 1, name: 'one', tags: ['a'], meta: {level: 1}}],
    ['new field', {note: 'text'}, {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 1}, note: 'text'}],
    [
      'new field with undefined value',
      {note: undefined},
      {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 1}, note: undefined},
    ],
    [
      'existing field set to undefined',
      {meta: undefined},
      {id: 1, name: 'one', tags: ['a', 'b'], meta: undefined},
    ],
    [
      'one of several fields',
      {name: 'one', tags: ['a', 'b'], meta: {level: 3}},
      {id: 1, name: 'one', tags: ['a', 'b'], meta: {level: 3}},
    ],
  ])('creates new entity when merging changed %s', (_, partial, expected) => {
    const items = createItems()
    const item = items[1]
    const otherItem = items[2]

    const result = applyEntityChanges({items}, {merge: {items: {1: partial}}})

    const resultItems = result!.items!
    expect(resultItems[1]).toStrictEqual(expected)
    // Entities are immutable in both modes, not changed entities are kept.
    expect(resultItems[1]).not.toBe(item)
    expect(item).toStrictEqual(createItems()[1])
    expect(resultItems[2]).toBe(otherItem)
  })

  test('does not change anything when merging undefined to the field that is already undefined', () => {
    const items = {1: {id: 1, name: 'one', tags: [], note: undefined}}
    const item = items[1]

    const result = applyEntityChanges({items}, {merge: {items: {1: {note: undefined}}}})

    expect(result).toBeUndefined()
    expect(items[1]).toBe(item)
  })

  test('merges only changed entities of the collection', () => {
    const items = createItems()
    const [item, otherItem] = [items[1], items[2]]

    const result = applyEntityChanges({items}, {merge: {items: {1: {name: 'one'}, 2: {name: 'TWO'}}}})

    const resultItems = result!.items!
    expect(resultItems[1]).toBe(item)
    expect(resultItems[2]).not.toBe(otherItem)
    expect(resultItems[2]).toStrictEqual({id: 2, name: 'TWO', tags: []})
  })

  test('adds entity that does not exist yet as is', () => {
    const items = createItems()
    const newItem = {id: 3, name: 'three', tags: []}

    const result = applyEntityChanges({items}, {merge: {items: {3: newItem}}})

    expect(result!.items![3]).toBe(newItem)
  })

  test('always creates new entity when deep comparison is disabled', () => {
    const items = createItems()
    const item = items[1]

    const result = createUtils(false).applyEntityChanges({items}, {merge: {items: {1: {name: 'one'}}}})

    const resultItems = result!.items!
    expect(resultItems[1]).not.toBe(item)
    expect(resultItems[1]).toStrictEqual(createItems()[1])
  })
})
