import {isExpired} from '../../utilsAndConstants'

const NOW = 1_000_000

test.each([
  ['not set (undefined)', undefined, false],
  ['not set (null)', null, false],
  ['in the past', NOW - 1, true],
  ['equal to now', NOW, true],
  ['in the future', NOW + 1, false],
  ['zero', 0, true],
])('expiresAt %s', (_, expiresAt, expected) => {
  expect(isExpired(expiresAt, NOW)).toBe(expected)
})

test('uses Date.now() when now is not provided', () => {
  jest.setSystemTime(NOW)

  expect(isExpired(NOW + 1)).toBe(false)
  expect(isExpired(NOW)).toBe(true)

  jest.setSystemTime(NOW + 1)

  expect(isExpired(NOW + 1)).toBe(true)
  expect(isExpired(undefined)).toBe(false)
})
