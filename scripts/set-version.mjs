// Sets the version of the next release in all places where it is written:
// - package.json
// - CHANGELOG.md: the Unreleased section becomes the section of this version, a new empty Unreleased is added.
//   Pre-release versions (e.g. 1.2.0-rc.0) keep the Unreleased section, their release notes are taken from it.
// Then commits these two files and creates the `v<version>` tag. Does not push: pushing the tag starts publishing.
// Usage: yarn set-version <version>

import {execFileSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_PATH = join(ROOT, 'package.json')
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md')
const UNRELEASED_HEADING = '## Unreleased'

const git = (...args) => execFileSync('git', args, {cwd: ROOT, encoding: 'utf8'}).trim()

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

/** Parses `major.minor.patch` with optional pre-release suffix, e.g. 1.2.3 or 1.2.3-rc.0. */
const parseVersion = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version)
  return match ? {numbers: match.slice(1, 4).map(Number), prerelease: match[4]} : undefined
}

/** Returns true if the first version is higher. Release is higher than its pre-releases, which are compared as strings. */
const isHigher = (a, b) => {
  for (let i = 0; i < 3; i += 1) {
    if (a.numbers[i] !== b.numbers[i]) {
      return a.numbers[i] > b.numbers[i]
    }
  }
  if (a.prerelease === undefined || b.prerelease === undefined) {
    return a.prerelease === undefined && b.prerelease !== undefined
  }
  return a.prerelease.localeCompare(b.prerelease, undefined, {numeric: true}) > 0
}

const version = process.argv[2]
const parsedVersion = version && parseVersion(version)
if (!parsedVersion) {
  fail('Usage: yarn set-version <version>, e.g. 1.2.3 or 1.2.3-rc.0')
}

// Validate everything before writing anything.

const tag = `v${version}`
if (git('tag', '--list', tag) !== '') {
  fail(`Git tag ${tag} already exists`)
}
// Version commit should contain only the version change.
if (git('status', '--porcelain', '--', 'package.json', 'CHANGELOG.md') !== '') {
  fail('package.json or CHANGELOG.md have uncommitted changes, commit them first')
}

const packageText = readFileSync(PACKAGE_PATH, 'utf8')
const currentVersion = JSON.parse(packageText).version
if (!isHigher(parsedVersion, parseVersion(currentVersion))) {
  fail(`Version ${version} is not higher than the current ${currentVersion}`)
}
const versionLine = `"version": "${currentVersion}"`
if (packageText.split(versionLine).length !== 2) {
  fail(`Expected exactly one ${versionLine} in package.json`)
}

let changelog = readFileSync(CHANGELOG_PATH, 'utf8')
const isPrerelease = parsedVersion.prerelease !== undefined

const lines = changelog.split('\n')
const unreleasedIndex = lines.indexOf(UNRELEASED_HEADING)
if (unreleasedIndex === -1) {
  fail(`CHANGELOG.md has no "${UNRELEASED_HEADING}" section`)
}
if (lines.some((line) => line.match(/^## \[?([^\]\s]+)\]?/)?.[1] === version)) {
  fail(`CHANGELOG.md already has a section for ${version}`)
}
const nextHeadingOffset = lines.slice(unreleasedIndex + 1).findIndex((line) => line.startsWith('## '))
const unreleasedLines = lines.slice(
  unreleasedIndex + 1,
  nextHeadingOffset === -1 ? undefined : unreleasedIndex + 1 + nextHeadingOffset,
)
if (unreleasedLines.every((line) => line.trim() === '')) {
  fail(`"${UNRELEASED_HEADING}" section of CHANGELOG.md is empty, there is nothing to release`)
}

if (!isPrerelease) {
  const now = new Date()
  const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((x) => String(x).padStart(2, '0'))
    .join('-')
  lines.splice(unreleasedIndex, 1, UNRELEASED_HEADING, '', `## ${version} - ${date}`)
  changelog = lines.join('\n')
}

// Write

writeFileSync(PACKAGE_PATH, packageText.replace(versionLine, `"version": "${version}"`))
console.log(`package.json: ${currentVersion} -> ${version}`)

if (isPrerelease) {
  console.log(`CHANGELOG.md: not changed, pre-release notes are taken from "${UNRELEASED_HEADING}"`)
} else {
  writeFileSync(CHANGELOG_PATH, changelog)
  console.log(`CHANGELOG.md: "${UNRELEASED_HEADING}" -> "## ${version}"`)
}

// Commit only these two files, other changes in the working tree and index are left as is.

git('commit', '--quiet', '-m', version, '--', 'package.json', 'CHANGELOG.md')
git('tag', '--annotate', tag, '-m', version)
console.log(`Committed as "${version}" and tagged ${tag}`)

console.log(`
To publish, push the commit with the tag:
  git push --follow-tags

To undo before pushing:
  git tag -d ${tag} && git reset HEAD~1 && git checkout -- package.json CHANGELOG.md`)
