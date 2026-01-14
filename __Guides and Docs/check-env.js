/**
 * SANITY CHECK: ENVIRONMENT & CONNECTIVITY
 * Run this with: node check-env.js
 */

const checkEnv = async () => {
    console.log("🔍 Starting Sanity Check...");

    // 1. Check for local vs production vars
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000';
    console.log(`📡 Target API URL: ${apiUrl}`);

    if (apiUrl.endsWith('/')) {
        console.warn("⚠️  WARNING: VITE_API_URL has a trailing slash. This often causes '//endpoint' errors.");
    }

    // 2. Try to ping the API
    console.log("🔗 Testing connection to API...");
    try {
        const start = Date.now();
        const response = await fetch(apiUrl);
        const duration = Date.now() - start;

        if (response.ok || response.status === 404) {
            // 404 is actually "good" here because it means the server responded, not a network crash
            console.log(`✅ API is reachable! (Status: ${response.status}, Time: ${duration}ms)`);
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
            if (data.services) {
                console.log("\n📊 System Report:");
                console.log(`   - Server Status: ${data.status === 'ok' ? '✅ Online' : '⚠️ Issues'}`);
                console.log(`   - Database: ${data.services.database === 'connected' ? '✅ Connected' : '❌ DISCONNECTED'}`);
                if (data.services.latency) console.log(`   - DB Latency: ${data.services.latency}`);
                console.log(`   - Environment: ${data.env?.node_env || 'unknown'}`);

                if (data.services.database !== 'connected') {
                    console.error("\n🚨 CRITICAL: Your backend is live but cannot talk to the Database!");
                    console.error(`   Error: ${data.error || 'Unknown DB Error'}`);
                    console.log("   Action: Check your DATABASE_URL in Railway variables.");
                    process.exit(1); // Fail for CI/CD
                }
            }
        }

    } catch (error) {
        console.error("❌ CONNECTION FAILED: Could not reach the API.");
        console.error(`   Error: ${error.message}`);
        console.log("   Action: Ensure your backend is running or your URL is correct.");
    }
};

checkEnv();