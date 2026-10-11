import {createStateComparer} from '../../utilsAndConstants'

const comparer = createStateComparer(['result', 'error'])

test('same state is equal', () => {
  const state = {result: 1}

  expect(comparer(state, state)).toBe(true)
  expect(comparer(undefined, undefined)).toBe(true)
})

test('state is not equal to undefined', () => {
  expect(comparer({result: 1}, undefined)).toBe(false)
  expect(comparer(undefined, {result: 1})).toBe(false)
})

test('compares only provided fields by reference', () => {
  const result = {id: 1}
  const error = new Error('test')

  expect(comparer({result, error, params: 1}, {result, error, params: 2})).toBe(true)
  expect(comparer({result, error}, {result: {id: 1}, error})).toBe(false)
  expect(comparer({result, error}, {result, error: new Error('test')})).toBe(false)
  expect(comparer({result}, {result, error})).toBe(false)
})

test('without fields all states are equal', () => {
  expect(createStateComparer([])({result: 1}, {result: 2})).toBe(true)
})
