import {createCache, withTypenames} from '../createCache'
import * as publicApi from '../index'
import {
  createStateComparer,
  defaultGetCacheKey,
  FetchPolicy,
  isEmptyObject,
  isExpired,
  noop,
} from '../utilsAndConstants'

test('exports only public api', () => {
  expect({...publicApi}).toStrictEqual({
    createCache,
    withTypenames,
    createStateComparer,
    defaultGetCacheKey,
    FetchPolicy,
    isEmptyObject,
    isExpired,
    noop,
  })
})

test('noop does nothing', () => {
  expect(publicApi.noop()).toBeUndefined()
})

test.each([
  [{}, true],
  [{a: undefined}, false],
  [[], true],
  [[1], false],
])('isEmptyObject(%j) is %s', (value, expected) => {
  expect(publicApi.isEmptyObject(value)).toBe(expected)
})
