// Runs the production build of the example in jsdom and walks through its main screens.
// Checks the build that is currently in `example/dist` with whatever `rrc` the example had installed.
// Use `yarn health-check` to check the local build of the library.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck fix later

import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {test} from 'node:test'
import {fileURLToPath} from 'node:url'

import {JSDOM, VirtualConsole} from 'jsdom'

const EXAMPLE_DIST = join(dirname(fileURLToPath(import.meta.url)), '../example/dist')
const WAIT_TIMEOUT = 5000
const WAIT_INTERVAL = 20

const caches = [
  {name: 'Redux: Normalized', rootPath: ''},
  {name: 'Redux: Normalized, mutable collections', rootPath: '/mutable'},
  {name: 'Redux: Not normalized', rootPath: '/not-normalized'},
  {name: 'Redux: Not normalized, optimized', rootPath: '/not-normalized-optimized'},
  {name: 'Zustand: Normalized', rootPath: '/zustand-normalized'},
  {name: 'Zustand: Not normalized, optimized', rootPath: '/zustand-not-normalized-optimized'},
]

assert.ok(existsSync(join(EXAMPLE_DIST, 'index.html')), 'example is not built, run `yarn build` in example/')

const html = readFileSync(join(EXAMPLE_DIST, 'index.html'), 'utf8')
const scriptPath = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
assert.ok(scriptPath, 'script not found in example/dist/index.html')
const script = readFileSync(join(EXAMPLE_DIST, scriptPath), 'utf8')

/** Opens the built example at the given path. Any uncaught error or console.error fails the check. */
const openExample = (path) => {
  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (error) => errors.push(error.detail ?? error))
  virtualConsole.on('error', (...args) => errors.push(args))

  const {window} = new JSDOM(html, {
    url: 'http://localhost' + path,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole,
  })
  // Missing in jsdom, used by the fake backend of the example.
  window.structuredClone = globalThis.structuredClone
  window.eval(script)

  const find = (selector) => window.document.querySelector(selector)

  const waitFor = async (description, getResult) => {
    const startedAt = Date.now()
    for (;;) {
      assert.deepEqual(errors, [], 'errors while waiting for: ' + description)
      const result = getResult()
      if (result) {
        return result
      }
      if (Date.now() - startedAt > WAIT_TIMEOUT) {
        assert.fail(`timed out waiting for: ${description}\npage text: ${window.document.body.textContent}`)
      }
      await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL))
    }
  }

  const click = async (selector) => {
    const element = await waitFor(selector, () => find(selector))
    element.dispatchEvent(new window.MouseEvent('click', {bubbles: true, cancelable: true, button: 0}))
  }

  return {
    window,
    find,
    waitFor,
    click,
    waitForText: (selector, text) =>
      waitFor(`"${text}" in ${selector}`, () => find(selector)?.textContent.includes(text)),
    waitForUserLinks: (count) =>
      waitFor(
        `${count} user links`,
        () => window.document.querySelectorAll('[id^="user-link-"]').length === count,
      ),
  }
}

test('root screen lists all examples', async () => {
  const {window, waitFor} = openExample('/')

  await waitFor(
    'links to examples',
    () => window.document.querySelectorAll('a.link').length === caches.length,
  )
  const paths = [...window.document.querySelectorAll('a.link')].map((link) => link.getAttribute('href'))
  assert.deepEqual(
    paths,
    caches.map(({rootPath}) => rootPath + '/users'),
  )

  window.close()
})

for (const {name, rootPath} of caches) {
  test(name, async (t) => {
    const {window, click, waitForText, waitForUserLinks} = openExample(rootPath + '/users')

    await t.test('query loads the first page', async () => {
      await waitForUserLinks(3)
      await waitForText('#user-link-0', 'User 0')
      await waitForText('#result', '"page":1')
    })

    await t.test('query loads the next page', async () => {
      await click('#load-next-page')
      await waitForUserLinks(6)
      await waitForText('#result', '"page":2')
    })

    await t.test('user screen shows the user and the bank', async () => {
      await click('#user-link-1')
      await waitForText('#user', '"name":"User 1"')
      await waitForText('#bank', '"name":"Bank 1"')
      assert.equal(window.location.pathname, rootPath + '/user/1')
    })

    await t.test('mutation updates the user', async () => {
      await click('#update-user')
      await waitForText('#user', '"name":"User 1 *"')
    })

    await t.test('users screen shows the updated user', async () => {
      await click('#users-link')
      await waitForText('#user-link-1', 'User 1 *')
      assert.equal(window.location.pathname, rootPath + '/users')
    })

    window.close()
  })
}
