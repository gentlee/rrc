const globals = globalThis as unknown as {__DEV__?: boolean; process?: unknown}

/** Loads a fresh copy of the module with provided globals, restoring them afterwards. */
const loadIsDev = (dev: boolean | undefined, processValue: unknown): boolean => {
  const originalProcess = globals.process
  let result: boolean
  try {
    if (dev !== undefined) {
      globals.__DEV__ = dev
    }
    globals.process = processValue
    jest.isolateModules(() => {
      result = require('../../utilsAndConstants').IS_DEV
    })
  } finally {
    globals.process = originalProcess
    delete globals.__DEV__
  }
  return result!
}

const processWithEnv = (nodeEnv: string | undefined) => ({
  ...process,
  env: {...process.env, NODE_ENV: nodeEnv},
})

describe('IS_DEV', () => {
  test.each([
    ['__DEV__ is true', true, processWithEnv('production'), true],
    ['__DEV__ is false, even in development', false, processWithEnv('development'), false],
    ['__DEV__ is true, process is not defined', true, undefined, true],
    ['NODE_ENV is development', undefined, processWithEnv('development'), true],
    ['NODE_ENV is production', undefined, processWithEnv('production'), false],
    ['NODE_ENV is test', undefined, processWithEnv('test'), false],
    ['NODE_ENV is not set', undefined, processWithEnv(undefined), false],
  ])('%s', (_, dev, processValue, expected) => {
    expect(loadIsDev(dev, processValue)).toBe(expected)
  })

  test.each([
    ['process is not defined', undefined],
    ['process has no env', {}],
  ])('does not throw and returns false when %s', (_, processValue) => {
    expect(loadIsDev(undefined, processValue)).toBe(false)
  })
})
