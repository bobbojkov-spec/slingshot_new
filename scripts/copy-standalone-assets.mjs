import fs from 'fs';
import path from 'path';

/**
 * Next.js standalone output doesn't include the 'public' or '.next/static' folders by default.
 * These must be manually copied into the standalone directory for the server to serve them.
 */

const __dirname = path.resolve();
const standaloneDir = path.join(__dirname, '.next', 'standalone');
const standaloneNextDir = path.join(standaloneDir, '.next');

async function copyDir(src, dest) {
    try {
        console.log(`Copying ${src} to ${dest}...`);
        await fs.promises.cp(src, dest, { recursive: true, force: true });
        console.log(`Successfully copied ${src}`);
    } catch (err) {
        console.error(`Error copying ${src}:`, err.message);
    }
}

async function main() {
    if (!fs.existsSync(standaloneDir)) {
        console.error('Standalone directory not found. Did you run "next build"?');
        return;
    }

    // 1. Ensure .next/standalone/.next exists
    if (!fs.existsSync(standaloneNextDir)) {
        fs.mkdirSync(standaloneNextDir, { recursive: true });
    }

    // 2. Copy .next/static to .next/standalone/.next/static
    const staticSrc = path.join(__dirname, '.next', 'static');
    const staticDest = path.join(standaloneNextDir, 'static');
    if (fs.existsSync(staticSrc)) {
        await copyDir(staticSrc, staticDest);
    }

    // 3. Copy public to .next/standalone/public
    const publicSrc = path.join(__dirname, 'public');
    const publicDest = path.join(standaloneDir, 'public');
    if (fs.existsSync(publicSrc)) {
        await copyDir(publicSrc, publicDest);
    }

    console.log('Post-build asset copy completed!');
}

main().catch(console.error);
