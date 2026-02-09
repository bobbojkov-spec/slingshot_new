const { config } = require('dotenv');
const { resolve } = require('node:path');

let loaded = false;

function ensureEnv() {
  if (loaded) return;

  const envPath = resolve(process.cwd(), '.env.local');
  const fallbackPath = resolve(process.cwd(), '.env');

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

