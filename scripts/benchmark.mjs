// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck fix later

import {createCache} from '../dist/index.js'

const {reducer: immutableReducer} = createCache({name: 'cache'})

const {reducer: mutableReducer} = createCache({name: 'cache', options: {mutableCollections: true}})

const results = {}

const benchmark = (name, reducer, initialCollectionSize, isWarmup = false) => {
  {
    // Warmup

    if (!isWarmup) {
      benchmark(name, reducer, 1000, true)
    }

    // Setup

    let state = {
      ...immutableReducer(undefined, {}),
      entities: {
        users: Array.from({length: initialCollectionSize})
          .map((_, i) => ({id: i, name: String(i), bankId: String(i)}))
          .reduce((r, x) => ((r[x.id] = x), r), {}),
      },
    }

    const run = (id) => {
      state = reducer(state, {
        type: '@rrc/cache/mergeEntityChanges',
        changes: {replace: {users: {[id]: {id}}}},
      })
    }

    globalThis.gc?.()

    // Measurement

    const addCount = 300
    const start = performance.now()
    for (let i = 0; i < addCount; i += 1) {
      run(i + initialCollectionSize)
    }

    // Log Results

    if (!isWarmup) {
      const result = ((performance.now() - start) / addCount) * 1000
      results[name] ??= {}
      results[name][initialCollectionSize] = Number(result.toFixed(2))
    }
  }

  globalThis.gc?.()
}

for (let i = 0, size = [0, 100, 1000, 10_000, 100_000, 1000_000]; i < size.length; i += 1) {
  benchmark('immutable', immutableReducer, size[i])
  benchmark('mutable', mutableReducer, size[i])
}

console.table(results)
