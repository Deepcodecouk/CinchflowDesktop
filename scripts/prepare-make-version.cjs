const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageLockPath = path.join(rootDir, 'package-lock.json');
const dryRun = process.argv.includes('--dry-run');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getNextVersion(currentVersion) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);

  if (!match) {
    throw new Error(`Expected package version to use major.minor.patch, received "${currentVersion}"`);
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10) + 1;

  return {
    full: `${major}.${minor}.0`,
    display: `${major}.${minor}`,
  };
}

const packageJson = readJson(packageJsonPath);
const nextVersion = getNextVersion(packageJson.version);

if (dryRun) {
  console.log(`Next make version: ${nextVersion.display} (${nextVersion.full})`);
  process.exit(0);
}

packageJson.version = nextVersion.full;
writeJson(packageJsonPath, packageJson);

if (fs.existsSync(packageLockPath)) {
  const packageLock = readJson(packageLockPath);
  packageLock.version = nextVersion.full;

  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].version = nextVersion.full;
  }

  writeJson(packageLockPath, packageLock);
}

console.log(`Prepared make version ${nextVersion.display} (${nextVersion.full})`);
