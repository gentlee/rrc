import {defaultGetCacheKey} from '../../utilsAndConstants'

const symbol = Symbol('key')

test.each([
  ['string', 'users', 'users'],
  ['empty string', '', ''],
  ['symbol', symbol, symbol],
  ['number', 1, '1'],
  ['boolean', true, 'true'],
  ['bigint', BigInt(10), '10'],
  ['undefined', undefined, 'undefined'],
  ['null', null, 'null'],
  ['object', {page: 1, filter: {name: 'a'}}, '{"page":1,"filter":{"name":"a"}}'],
  ['array', [1, 'a'], '[1,"a"]'],
])('%s params', (_, params, expected) => {
  expect(defaultGetCacheKey(params)).toBe(expected)
})

test('objects with different order of keys have different cache keys', () => {
  expect(defaultGetCacheKey({a: 1, b: 2})).not.toBe(defaultGetCacheKey({b: 2, a: 1}))
})
