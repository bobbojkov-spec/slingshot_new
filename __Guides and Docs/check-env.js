/**
 * SANITY CHECK: ENVIRONMENT & CONNECTIVITY
 * Run this with: node check-env.js
 */

const checkEnv = async () => {
    console.log("🔍 Starting Sanity Check...");

    // 1. Check for local vs production vars
    // 1. Check for local vs production vars
    // Default to localhost:3000 for Next.js app
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Construct health endpoint from site URL
    const apiUrl = siteUrl.endsWith('/')
        ? `${siteUrl}api/health`
        : `${siteUrl}/api/health`;

    console.log(`📡 Target API URL: ${apiUrl}`);

    if (siteUrl.endsWith('/') && !siteUrl.includes('api')) {
        // Only warn if it looks like a base URL with a trailing slash
    }

    // 2. Try to ping the API
    console.log("🔗 Testing connection to API...");
    try {
        const start = Date.now();
        const response = await fetch(apiUrl);
        const duration = Date.now() - start;

        if (response.ok) {
            console.log(`✅ API is reachable! (Status: ${response.status}, Time: ${duration}ms)`);
        } else {
            console.log(`⚠️ API reachable but returned status: ${response.status}`);
        }

        // 3. Check for the JSON trap
        const contentType = response.headers.get("content-type");
        if (contentType && !contentType.includes("application/json")) {
            console.error("❌ DANGER: API returned HTML/Text instead of JSON.");
            console.error("   This will cause the 'Unexpected token <' error in your frontend.");
            console.log("   Action: Check if your API route exists or if Railway is serving a 404 page.");
        } else {
            console.log("✅ API is returning JSON correctly.");

            // Advanced Service Check
            const data = await response.json();

            // Check for simple { db: 'ok' } response from app/api/health/route.ts
            if (data.db === 'ok') {
                console.log("\n📊 System Report:");
                console.log(`   - Server Status: ✅ Online`);
                console.log(`   - Database: ✅ Connected`);
                console.log(`   - Environment: ${process.env.NODE_ENV || 'unknown'}`);
            } else if (data.services) {
                // Keep backward compatibility for original script format if needed
                console.log("\n📊 System Report:");
                console.log(`   - Server Status: ${data.status === 'ok' ? '✅ Online' : '⚠️ Issues'}`);
                console.log(`   - Database: ${data.services.database === 'connected' ? '✅ Connected' : '❌ DISCONNECTED'}`);
                if (data.services.latency) console.log(`   - DB Latency: ${data.services.latency}`);
                console.log(`   - Environment: ${data.env?.node_env || 'unknown'}`);
            } else {
                // Unknown response format but technically successful JSON
                console.log("\n⚠️  Unknown JSON response format:");
                console.log(data);
                console.log("   But at least it's JSON and the DB check didn't crash.");
            }

            if (data.db === 'error') {
                console.error("\n🚨 CRITICAL: Your backend is live but cannot talk to the Database!");
                console.error(`   Error: ${data.error || 'Unknown DB Error'}`);
                console.log("   Action: Check your DATABASE_URL in Railway variables.");
                process.exit(1);
            }
        }

    } catch (error) {
        console.error("❌ CONNECTION FAILED: Could not reach the API.");
        console.error(`   Error: ${error.message}`);
        console.log("   Action: Ensure your backend is running or your URL is correct.");
        process.exit(1);
    }
};

checkEnv();