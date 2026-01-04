const { config } = require('dotenv');
const { resolve } = require('node:path');

let loaded = false;

function ensureEnv() {
  if (loaded) return;
  loaded = true;
  const envPath = resolve(process.cwd(), '.env.local');
  config({ path: envPath });
}

module.exports = {
  ensureEnv,
};

