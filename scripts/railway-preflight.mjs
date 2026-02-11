import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// --- 1. Load Env Vars (Manual Parse to avoid deps) ---
const loadEnv = (file) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return {};
    console.log(`Loading ${file}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.replace(/\\n/gm, '\n');
            }
            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            result[key] = value;
        }
    });
    return result;
};

// Priority: process.env > .env.production > .env.local > .env
const env = {
    ...loadEnv('.env'),
    ...loadEnv('.env.local'),
    ...loadEnv('.env.production'),
    ...process.env
};

console.log('--- 🚀 Railway Deployment Preflight Check ---');

// --- 2. Verify VITE_API_URL ---
const apiUrl = env.VITE_API_URL;
if (!apiUrl) {
    console.error('❌ FATAL: VITE_API_URL is missing in .env or .env.production');
    process.exit(1);
}
console.log(`✅ Found VITE_API_URL: ${apiUrl}`);

// --- 3. Validate API JSON Response ---
// Use /health URL as it is public and reliable
const targetUrl = `${apiUrl.replace(/\/$/, '')}/api/health`;

const validateApi = async () => {
    try {
        console.log(`Testing API connectivity: ${targetUrl}`);
        const res = await fetch(targetUrl);

        // Rule: Status 200
        if (res.status !== 200) {
            console.error(`❌ API Check Failed: Status is ${res.status} (Expected 200)`);
            console.error(`   URL: ${targetUrl}`);
            process.exit(1);
        }

        // Rule: JSON Content Type
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error(`❌ API Check Failed: Invalid Content-Type '${contentType}'`);
            console.error(`   The URL returned HTML or Text. This means VITE_API_URL is pointing to the Frontend or a wrong domain.`);
            process.exit(1);
        }

        const text = await res.text();

        // Rule: Not HTML
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
            console.error(`❌ API Check Failed: Response body looks like HTML.`);
            console.error(`   This confirms the 'Frontend calling Frontend' routing issue.`);
            process.exit(1);
        }

        // Try Parse
        JSON.parse(text);
        console.log(`✅ API Verified: Returns valid JSON`);

    } catch (err) {
        console.error(`❌ API Connectivity Error: ${err.message}`);
        console.error(`   Ensure the Backend is RUNNING locally or at the URL provided.`);
        process.exit(1);
    }
};

// --- 4. Run Build ---
const runBuild = () => {
    console.log('--- 🏗️ Running Production Build ---');
    try {
        execSync('npx next build', { stdio: 'inherit', cwd: rootDir });
        console.log('✅ Build passed');
    } catch (err) {
        console.error('❌ Build Failed');
        process.exit(1);
    }
};

(async () => {
    await validateApi();
    runBuild();
    console.log('--- 🎉 Preflight Passed. Ready to Deploy. ---');
    process.exit(0);
})();
