import {FetchPolicy} from '../../utilsAndConstants'

const NOW = 1_000_000

describe('FetchPolicy.NoCacheOrExpired', () => {
  test.each([
    ['no result', {}, true],
    ['no result, not expired', {expiresAt: NOW + 1}, true],
    ['result without expiresAt', {result: 1}, false],
    ['result, not expired', {result: 1, expiresAt: NOW + 1}, false],
    ['result, expires now', {result: 1, expiresAt: NOW}, true],
    ['result, expired', {result: 1, expiresAt: NOW - 1}, true],
  ])('%s', (_, state, expected) => {
    expect(FetchPolicy.NoCacheOrExpired(undefined, state, undefined, NOW)).toBe(expected)
  })

  test('uses Date.now() when now is not provided', () => {
    const state = {result: 1, expiresAt: NOW}

    jest.setSystemTime(NOW - 1)
    expect(FetchPolicy.NoCacheOrExpired(undefined, state)).toBe(false)

    jest.setSystemTime(NOW)
    expect(FetchPolicy.NoCacheOrExpired(undefined, state)).toBe(true)

    // Explicit time has priority over the current time.
    expect(FetchPolicy.NoCacheOrExpired(undefined, state, undefined, NOW - 1)).toBe(false)
  })
})

test('FetchPolicy.Always', () => {
  expect(FetchPolicy.Always()).toBe(true)
})
