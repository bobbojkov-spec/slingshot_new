const { config } = require('dotenv');
const { resolve } = require('node:path');

let loaded = false;

function ensureEnv() {
  if (loaded || process.env.NODE_ENV === 'production') {
    loaded = true;
    return;
  }

  // Safety check for Edge Runtime or non-Node environments
  const p = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  if (!p || typeof p.cwd !== 'function') {
    loaded = true;
    return;
  }

  const cwd = p.cwd();
  const envPath = resolve(cwd, '.env.local');
  const fallbackPath = resolve(cwd, '.env');

  if (require('node:fs').existsSync(envPath)) {
    config({ path: envPath });
  } else if (require('node:fs').existsSync(fallbackPath)) {
    config({ path: fallbackPath });
  } else {
    config(); // default
  }

  loaded = true;
}

module.exports = {
  ensureEnv,
};

