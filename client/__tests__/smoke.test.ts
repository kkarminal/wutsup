/**
 * Smoke tests for the Wutsup project structure.
 *
 * Validates: Requirements 1.2, 1.3, 8.1, 9.1, 10.1
 */

import * as fs from 'fs';
import * as path from 'path';

const CLIENT_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(CLIENT_ROOT, '..');

describe('Client directory structure', () => {
  const expectedDirs = [
    'app',
    'components',
    'hooks',
    'screens',
    'services',
    'utils',
    'constants',
  ];

  it.each(expectedDirs)('client/%s directory exists', (dir) => {
    const dirPath = path.join(CLIENT_ROOT, dir);
    expect(fs.existsSync(dirPath)).toBe(true);
    expect(fs.statSync(dirPath).isDirectory()).toBe(true);
  });
});

describe('TypeScript strict mode', () => {
  it('tsconfig.json has strict: true', () => {
    const tsconfigPath = path.join(CLIENT_ROOT, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);

    const raw = fs.readFileSync(tsconfigPath, 'utf-8');
    // Strip single-line comments for JSONC compatibility
    const stripped = raw.replace(/\/\/.*$/gm, '');
    const tsconfig = JSON.parse(stripped);

    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });
});

describe('API directory structure', () => {
  const expectedDirs = [
    'Controllers',
    'Services',
    'Models',
    'Data',
    'Configuration',
  ];

  it.each(expectedDirs)('api/%s directory exists', (dir) => {
    const dirPath = path.join(PROJECT_ROOT, 'api', dir);
    expect(fs.existsSync(dirPath)).toBe(true);
    expect(fs.statSync(dirPath).isDirectory()).toBe(true);
  });
});

describe('Docker Compose', () => {
  it('docker-compose.yml exists at project root', () => {
    const composePath = path.join(PROJECT_ROOT, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
  });
});

describe('Steering files', () => {
  const steeringDir = path.join(PROJECT_ROOT, '.kiro', 'steering');

  it('product.md exists and contains expected sections', () => {
    const filePath = path.join(steeringDir, 'product.md');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Wutsup');
    expect(content).toContain('Product Overview');
  });

  it('tech.md exists and contains expected sections', () => {
    const filePath = path.join(steeringDir, 'tech.md');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Technology Stack');
  });

  it('structure.md exists and contains expected sections', () => {
    const filePath = path.join(steeringDir, 'structure.md');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Project Structure');
  });
});
