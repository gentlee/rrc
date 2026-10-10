# Agent instructions

Write documentation, comments, and other repository text in English.
Use Yarn Classic and keep the existing yarn.lock files.
Never modify the git index or history unless explicitly asked: no `git add`, `git reset`, `git stash`, or commits. Leave your edits as unstaged working-tree changes, even when other changes in the same files are already staged.

## Architecture and reference

Use a functional/procedural style: compose functions and plain objects; do not introduce classes.
Read the relevant sections of [README.md](README.md) for design principles, initialization, and cache behavior, and [DOCUMENTATION.md](DOCUMENTATION.md) for the API reference.

## Validation

Run from the repository root for library changes:

```sh
yarn tsc --noEmit -p tsconfig.json
yarn lint
yarn test --runInBand
```

For a focused test run, append `--runTestsByPath src/__tests__/<file>` to the test command.
Markdown-only changes do not require the code checks above.

- `yarn build` also regenerates documentation and runs size measurement and benchmarks. Use the commands above for routine validation.
- `dist` is build output and is not committed. `yarn build-lib` creates it; `yarn benchmark` and `yarn size` need it to exist.
- When changing build configuration, run `yarn build-lib` and verify the emitted JavaScript and declarations. Build errors must fail the command.
- Add user-facing changes to the `Unreleased` section of `CHANGELOG.md`, breaking changes first.
- `DOCUMENTATION.md` is generated from source comments by `scripts/generate-docs.ts`. Edit the source and run `yarn generate-docs`; its Node runtime must support `--experimental-strip-types`.

## Cache and tests

- Preserve both `mutableCollections` modes. Mutable collections may change in place, but individual entities and query/mutation states remain immutable. Collection subscriptions depend on `_changeKey`.
- Reuse `src/testing/` fixtures and the existing `describe.each(testCaches)` pattern for behavior shared across cache variants.
- Fake timers are enabled globally in `src/testing/setup.ts`. Use the timer helpers in `src/testing/utils.ts` and `act` for React updates. Setup also rejects unexpected `console.warn` calls.

## Example application

- `example/` has separate dependencies and checks. Run `yarn lint` and `yarn build` there when changing it; root lint excludes this directory.
- The example can use either the published or the local `rrc`. `yarn install` in `example/` installs the version from npm. `yarn sync-example` in the root builds the library and replaces `example/node_modules/rrc` with a copy of the root `dist` and `package.json`.
- Switching works in both directions: `sync-example` removes the Vite dependency cache and Yarn's integrity file, so the next `yarn install` in `example/` restores the npm version, and the example's `postinstall` removes the Vite cache again.
- In the root, `yarn example` runs the example with the npm version and `yarn example-dist` with the local build. Both install example dependencies and run its `release` script: a production build served by `vite preview`. Use `yarn dev` in `example/` for the dev server.
- `yarn health-check` in the root installs example dependencies, syncs the local build into the example, builds it for production and runs `scripts/health-check.mjs`, which loads the built bundle in jsdom and walks through the main screens of every cache variant. It leaves the local copy of `rrc` in the example. It is not part of `yarn test`; `prepublishOnly` runs it after the tests. To check the installed npm version instead, build the example and run `node --test scripts/health-check.mjs`.

## Releases

- To release: run `yarn set-version <version>` (e.g. 0.24.0-rc.0). It sets the version in `package.json`, turns the `Unreleased` section of `CHANGELOG.md` into the section of this version (pre-release versions keep `Unreleased`), commits these two files and creates the `v<version>` tag. It does not push: `git push --follow-tags` starts publishing. The workflow fails before publishing if the tag does not match `package.json` version or the changelog has no section for it.
- `.github/workflows/ci.yml` runs type check, lint, tests and the health check on pushes to `main` and on pull requests.
- `.github/workflows/publish.yml` publishes to npm when a `v*` tag is pushed, using npm trusted publishing (no token in the repository), and creates a GitHub release from `CHANGELOG.md` using `scripts/release-notes.mjs`. Versions with a pre-release suffix are published with the `rc` dist-tag. Do not rename the workflow file: its name is a part of the trusted publisher configuration on npmjs.com.
- `prepublishOnly` runs lint, build, tests and the health check. `yarn build` additionally regenerates documentation, measures size and runs benchmarks, and is not a part of publishing.
- Never publish or push tags unless explicitly asked.
