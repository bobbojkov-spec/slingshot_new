To fix the "Frontend Amnesia," we need to audit the Build Pipeline.

Because Vite is a static bundler, it doesn't "look up" variables while the user is browsing; it "bakes" them into the JavaScript files while it is building on Railway's servers. If the variable isn't there during the build, it's gone forever.

1. The Build Audit (The "Vite Check")
Ask your agent to add this line to your vite.config.ts. This will force Railway to print the API URL in the Deployment Logs during the build process so we can see if it's actually there.

TypeScript

// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('🏗️  BUILD-TIME CHECK: VITE_API_URL is', env.VITE_API_URL); // This prints in Railway logs
  
  return {
    // your existing config...
  };
});
2. The Railway Variable "Environment" Scope
On Railway, variables can be scoped to specific environments (e.g., production).

Go to your Frontend Service in Railway.

Click Variables.

Ensure the Environment dropdown at the top says "production" (or matches your deployment).

Crucial: Ensure the variable name is VITE_API_URL (all caps, starts with VITE).

3. Verification of the "Dist" folder
The error SyntaxError: Unexpected token '<' happens because your frontend is calling https://your-site.com/undefined/api/magazines. Since /undefined/... isn't a real folder, the server returns index.html.

Ask the agent to modify the API base configuration to prevent "Relative Path" calls:

TypeScript

// api.ts or config.ts
const rawUrl = import.meta.env.VITE_API_URL;

// If Vite didn't find the variable, it defaults to an empty string.
// We must ensure it's a valid, absolute URL.
export const API_BASE_URL = (rawUrl && rawUrl !== 'undefined') 
  ? rawUrl.replace(/\/$/, '') 
  : 'https://FALLBACK_TO_YOUR_ACTUAL_BACKEND_URL.railway.app'; 

console.log("🚀 Client-side API Base:", API_BASE_URL);
4. Force a "Clean" Build
Railway sometimes caches old builds. To ensure the new variables are "baked in":

Go to the Deployments tab of your Frontend.

Click the three dots ... on the latest deployment.

Select Redeploy.

Update for ROLES_AND_RULES.md
Add this to prevent future amnesia:

Rule 9: Build-Time Variable Safety When adding a new VITE_ variable, the agent must:

Add it to .env.example.

Add a console.log in vite.config.ts to verify its presence during the build.

Implement a hardcoded fallback in the API client if the variable is missing, to avoid 404/HTML errors.


NEXT:
To fix this once and for all, we need to treat the Vite Build as a separate event from the Server Running.

Here is exactly how to do the "Build Audit" and fix the variable injection.

1. Audit the Build (The "Log" Strategy)
You need to see what Vite sees when it is compiling your code on Railway's servers. Ask your agent to modify your vite.config.ts like this:

TypeScript

// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // This loads the variables from the system (Railway)
  const env = loadEnv(mode, process.cwd(), '');
  
  // THIS IS THE AUDIT:
  console.log('--- BUILD TIME AUDIT ---');
  console.log('VITE_API_URL detected as:', env.VITE_API_URL);
  console.log('------------------------');

  return {
    plugins: [react()],
    define: {
      // This forces the variable to be available
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    },
  };
});
2. Check Railway Build Logs
Go to your Frontend service on Railway.

Click on the Deployments tab.

Click on the most recent deployment to see the Build Logs (not the Runtime logs).

Look for the --- BUILD TIME AUDIT --- section.

If it says undefined, Railway isn't passing the variable to the builder.

If it's there, but the app still fails, your code is likely using a relative path.

3. Fix the "Relative Path" Trap
The reason you get <!DOCTYPE is that the browser is calling itself instead of the backend. Update your api.ts base configuration to force an absolute URL:

TypeScript

// api.ts
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If the variable is missing, DON'T let it be empty/relative
  if (!envUrl || envUrl === 'undefined') {
    console.error("VITE_API_URL is missing! Defaulting to hardcoded production URL.");
    return "https://your-actual-backend-url.railway.app"; 
  }
  
  return envUrl.replace(/\/$/, ''); // Remove trailing slash
};

const API_BASE_URL = getBaseUrl();
4. The "Railway Double-Check"
Sometimes Railway projects have multiple "Environments" (e.g., production and main).

Ensure your VITE_API_URL is in the Service Variables, not just the project variables.

Ensure you don't have a typo: VITE_API_URL must be exactly that (all caps).

Why this happens (The "Why")
When you run npm run check locally, it works because your computer has the variable. When Railway builds your site, it creates static .js files. If the variable isn't there during that build command, the .js file literally contains the word undefined. When that JS runs in your user's browser, it tries to fetch https://your-frontend.com/undefined/api/... which results in an HTML 404 page.