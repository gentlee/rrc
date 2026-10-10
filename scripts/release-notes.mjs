// Prints the section of CHANGELOG.md for the provided version, used as the text of the GitHub release.
// Pre-release versions (e.g. 1.2.0-rc.0) use the Unreleased section if they do not have their own.
// Usage: node scripts/release-notes.mjs <version>

import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const version = process.argv[2]
if (!version) {
  console.error('Usage: node scripts/release-notes.mjs <version>')
  process.exit(1)
}

const changelog = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../CHANGELOG.md'), 'utf8')

/** Returns the text between `## <title>` and the next `## ` heading. Title can be followed by a date. */
const getSection = (title) => {
  const lines = changelog.split('\n')
  const start = lines.findIndex((line) => {
    const heading = line.match(/^## \[?([^\]\s]+)\]?/)?.[1]
    return heading?.toLowerCase() === title.toLowerCase()
  })
  if (start === -1) {
    return undefined
  }
  const length = lines.slice(start + 1).findIndex((line) => line.startsWith('## '))
  return lines
    .slice(start + 1, length === -1 ? undefined : start + 1 + length)
    .join('\n')
    .trim()
}

const isPrerelease = version.includes('-')
const notes = getSection(version) ?? (isPrerelease ? getSection('Unreleased') : undefined)

if (!notes) {
  console.error(
    `CHANGELOG.md has no section "## ${version}". Rename the Unreleased section before publishing a release.`,
  )
  process.exit(1)
}

console.log(notes)
