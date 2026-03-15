const fs = require('node:fs');
const path = require('node:path');

const ajvDotjsDir = path.join(__dirname, '..', 'node_modules', 'eslint', 'node_modules', 'ajv', 'lib', 'dotjs');
const constPath = path.join(ajvDotjsDir, 'const.js');

if (!fs.existsSync(ajvDotjsDir) || fs.existsSync(constPath)) {
  process.exit(0);
}

const fallback = fs
  .readdirSync(ajvDotjsDir)
  .find((entry) => entry.startsWith('const.js.DELETE.'));

if (!fallback) {
  process.exit(0);
}

fs.copyFileSync(path.join(ajvDotjsDir, fallback), constPath);
