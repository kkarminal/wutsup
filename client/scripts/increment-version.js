#!/usr/bin/env node

/**
 * Auto-increment build number and bump minor version.
 * Run this before `expo prebuild` via the npm script.
 *
 * - buildNumber increments by 1 every run
 * - version minor increments by 1 every run (e.g. 1.1.0 → 1.2.0)
 *
 * Stores state in version.json so it persists across builds.
 */

const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'version.json');

const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

// Increment build number
data.buildNumber += 1;

// Bump minor version
const parts = data.version.split('.');
parts[1] = String(Number(parts[1]) + 1);
data.version = parts.join('.');

fs.writeFileSync(versionFile, JSON.stringify(data, null, 2) + '\n');

console.log(`Version: ${data.version}, Build: ${data.buildNumber}`);
