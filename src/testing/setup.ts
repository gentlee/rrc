import '@testing-library/jest-dom'

import {InnerStore} from '../typesPrivate'
import {clearEventLog} from './api/utils'
import {testCaches} from './redux/cache'
import {createdStores} from './redux/store'

export const consoleWarnSpy = jest.spyOn(console, 'warn')

jest.useFakeTimers()

afterEach(() => {
  clearEventLog()

  expect(consoleWarnSpy).toBeCalledTimes(0)
})

afterAll(() => {
  // No abort controllers should be left after mutations are finished or aborted.
  for (const [_, testCache] of testCaches) {
    for (const store of createdStores) {
      // Comparing keys only: printing AbortController in a failed assertion crashes Node.
      expect(Object.keys(testCache.abortControllers.get(store as InnerStore) ?? {})).toStrictEqual([])
    }
  }
})
