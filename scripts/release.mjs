#!/usr/bin/env zx
/**
 * Bump all proof-of-concept package versions in lockstep, commit, and tag.
 *
 * Complements scripts/release-captain/ (changelog + maturity audit + release PR).
 * Run this after merging the release-captain PR to apply the version bump.
 *
 * Usage:
 *   npx zx scripts/release.mjs patch
 *   npx zx scripts/release.mjs minor
 *   npx zx scripts/release.mjs 0.3.0
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { $, argv, chalk } from 'zx'

$.verbose = false

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const POC_ROOT = join(ROOT, 'proof-of-concept')

const BUMPS = new Set(['patch', 'minor', 'major'])
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const bumpArg = String(argv._[0] ?? 'patch')

const packagePaths = await discoverPackageJsonPaths()
const packages = await Promise.all(
	packagePaths.map(async path => ({
		path,
		pkg: JSON.parse(await readFile(path, 'utf8')),
	})),
)

const versions = packages.map(({ pkg }) => pkg.version).filter(Boolean)
if (versions.length === 0) {
	console.error(chalk.red('No package versions found under proof-of-concept/.'))
	process.exit(1)
}

const uniqueVersions = [...new Set(versions)]
const current = uniqueVersions.sort(compareSemver).at(-1)

if (uniqueVersions.length > 1) {
	console.log(
		chalk.yellow(
			`Warning: package versions are out of sync (${uniqueVersions.join(', ')}). Using highest: ${current}`,
		),
	)
}

const next = computeNext(current, bumpArg)
const tag = `v${next}`

console.log(chalk.cyan(`Packages: ${packages.length} under proof-of-concept/`))
console.log(chalk.cyan(`Current version: ${current}`))
console.log(chalk.green(`   Next version: ${next}  (tag: ${tag})`))

const existingTag = (await $`git tag --list ${tag}`.nothrow()).stdout.trim()
if (existingTag) {
	console.error(chalk.red(`\nTag ${tag} already exists. Aborting.`))
	process.exit(1)
}

for (const entry of packages) {
	entry.pkg.version = next
	await writeFile(entry.path, `${JSON.stringify(entry.pkg, null, 2)}\n`)
	console.log(chalk.gray(`  bumped ${relativeToRoot(entry.path)}`))
}

const pathsToStage = packages.map(({ path }) => path)
await $`git add -- ${pathsToStage}`
await $`git commit -m ${`chore(release): ${tag}`}`
await $`git tag -a ${tag} -m ${`Release ${tag}`}`

console.log(chalk.green(`\nDone. Bumped ${packages.length} package.json files + tagged ${tag}.`))
console.log(chalk.gray('Other dirty files (if any) were left untouched.'))
console.log(chalk.gray('Push with:'))
console.log(chalk.bold('  git push --follow-tags'))

async function discoverPackageJsonPaths() {
	const paths = [join(POC_ROOT, 'package.json')]
	const packagesDir = join(POC_ROOT, 'packages')

	for (const entry of await readdir(packagesDir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			paths.push(join(packagesDir, entry.name, 'package.json'))
		}
	}

	return paths.sort()
}

function relativeToRoot(absPath) {
	return absPath.startsWith(`${ROOT}/`) ? absPath.slice(ROOT.length + 1) : absPath
}

function compareSemver(a, b) {
	const parse = version => version.split('.').map(part => Number.parseInt(part, 10))
	const [aMaj, aMin, aPat] = parse(a)
	const [bMaj, bMin, bPat] = parse(b)

	if (aMaj !== bMaj) return aMaj - bMaj
	if (aMin !== bMin) return aMin - bMin
	return aPat - bPat
}

function computeNext(version, input) {
	if (SEMVER_RE.test(input)) return input
	if (!BUMPS.has(input)) {
		throw new Error(`Unknown argument: "${input}". Use patch | minor | major | x.y.z`)
	}

	const [maj, min, pat] = version.split('.').map(n => Number.parseInt(n, 10))
	if (Number.isNaN(maj) || Number.isNaN(min) || Number.isNaN(pat)) {
		throw new Error(`Invalid current version: "${version}"`)
	}

	if (input === 'major') return `${maj + 1}.0.0`
	if (input === 'minor') return `${maj}.${min + 1}.0`
	return `${maj}.${min}.${pat + 1}`
}
