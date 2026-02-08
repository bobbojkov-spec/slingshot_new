const { config } = require('dotenv');
const { resolve } = require('node:path');

let loaded = false;

function ensureEnv() {
  // Next.js automatically loads .env files, so explicit loading is usually redundant
  // but we'll keep this as a no-op to avoid breaking consumers.
  if (loaded) return;
  loaded = true;
}

module.exports = {
  ensureEnv,
};

