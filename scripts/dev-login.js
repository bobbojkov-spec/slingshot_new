#!/usr/bin/env node
/**
 * DEV ONLY helper to obtain an admin session cookie without using the UI.
 * Reads DEV_ADMIN_EMAIL and DEV_ADMIN_DEVICE_ID (optional) from env vars.
 * Prints the Set-Cookie header that you can paste into the browser.
 *
 * Do NOT run this in production.
 */

const { ensureEnv } = require('../lib/env');

ensureEnv();

const host = process.env.DEV_ADMIN_HOST || 'http://localhost:3000';
const email = process.env.DEV_ADMIN_EMAIL;
const deviceId = process.env.DEV_ADMIN_DEVICE_ID || 'dev-admin-device';
const password = process.env.DEV_ADMIN_PASSWORD;

if (!email) {
  console.error('Please set DEV_ADMIN_EMAIL in your .env.local');
  process.exit(1);
}

async function run() {
  const url = new URL('/api/auth/login-with-password', host).toString();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, deviceId, password }),
  });

  const body = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', body);

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    console.log('\nSet-Cookie header (paste this into the browser):');
    console.log(setCookie);
  } else {
    console.log('\nNo Set-Cookie header received. Ensure the login succeeded.');
  }
}

run().catch((err) => {
  console.error('dev login failed', err);
  process.exit(1);
});

