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
- When changing build configuration, run `yarn build-lib` and verify the emitted JavaScript and declarations. Build errors must fail the command.
- `DOCUMENTATION.md` is generated from source comments by `scripts/generate-docs.ts`. Edit the source and run `yarn generate-docs`; its Node runtime must support `--experimental-strip-types`.

## Cache and tests

- Preserve both `mutableCollections` modes. Mutable collections may change in place, but individual entities and query/mutation states remain immutable. Collection subscriptions depend on `_changeKey`.
- Reuse `src/testing/` fixtures and the existing `describe.each(testCaches)` pattern for behavior shared across cache variants.
- Fake timers are enabled globally in `src/testing/setup.ts`. Use the timer helpers in `src/testing/utils.ts` and `act` for React updates. Setup also rejects unexpected `console.warn` calls.

## Example application

- `example/` has separate dependencies and checks. Run `yarn lint` and `yarn build` there when changing it; root lint excludes this directory.
- The example imports a published `rrc` package, with no alias to local library source. To validate local library changes through the example, explicitly connect the local package first.
