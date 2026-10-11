// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck fix later

import {createCache} from '../dist/index.js'

const {reducer: immutableReducer} = createCache({name: 'cache'})

const {reducer: mutableReducer} = createCache({name: 'cache', options: {mutableCollections: true}})

const results = {}

/** Prints results as a markdown table. Name of the test is in the corner header instead of the "(index)" of console.table. */
const printTable = (title, rows) => {
  const columns = Object.keys(Object.values(rows)[0])
  const lines = [
    [title, ...columns],
    ...Object.entries(rows).map(([name, values]) => [name, ...columns.map((x) => String(values[x]))]),
  ]
  const widths = lines[0].map((_, i) => Math.max(...lines.map((line) => line[i].length)))
  const format = (line) => '| ' + line.map((x, i) => x.padEnd(widths[i])).join(' | ') + ' |'

  console.log(format(lines[0]))
  console.log('|' + widths.map((x) => '-'.repeat(x + 2)).join('|') + '|')
  lines.slice(1).forEach((line) => console.log(format(line)))
  console.log()
}

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

printTable('Add entity by collection size, μs', results)

// Merging entities that are already in the collection, in microseconds per merge of 100 entities.

const mergeResults = {}

const mergeBenchmark = (name, reducer, changed) => {
  const collectionSize = 1000
  const mergeSize = 100
  const createUser = (i, name = String(i)) => ({id: i, name, bankId: String(i), email: i + '@mail.com'})

  let state = {
    ...immutableReducer(undefined, {}),
    entities: {
      users: Array.from({length: collectionSize})
        .map((_, i) => createUser(i))
        .reduce((r, x) => ((r[x.id] = x), r), {}),
    },
  }

  const run = (iteration) => {
    const users = {}
    for (let i = 0; i < mergeSize; i += 1) {
      users[i] = {id: i, name: changed ? String(iteration) : String(i)}
    }
    state = reducer(state, {type: '@rrc/cache/mergeEntityChanges', changes: {merge: {users}}})
  }

  const count = 2000
  for (let i = 0; i < count; i += 1) {
    run(-i - 1) // Warmup
  }
  globalThis.gc?.()

  const start = performance.now()
  for (let i = 0; i < count; i += 1) {
    run(i)
  }
  mergeResults[name] ??= {}
  mergeResults[name][changed ? 'changed' : 'not changed'] = Number(
    (((performance.now() - start) / count) * 1000).toFixed(2),
  )
}

for (const changed of [false, true]) {
  mergeBenchmark('immutable', immutableReducer, changed)
  mergeBenchmark('mutable', mutableReducer, changed)
}

printTable('Merge 100 of 1000 entities, μs', mergeResults)
