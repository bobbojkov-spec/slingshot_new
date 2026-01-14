The "Environment-Safe" Rules for Your Agent
Rule 1: Never Hardcode URLs
The agent must never write http://localhost:5000 directly in any service file. It must use an environment variable with a fallback.

Action: Create a centralized config.ts or api.ts that defines the base URL once.

Code Pattern: ```typescript const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


Rule 2: Use "Fail-Fast" Validation
Before the app starts, the agent should check if critical variables are missing and log a specific error, rather than letting the app crash with a generic JSON SyntaxError.

Action: Add a small check-up script that runs on initialization.

Rule 3: Single Source of Truth for API Calls
The agent must use a central Axios/Fetch instance. This prevents the "trailing slash" issue and ensures headers (like Auth) are applied consistently.

Action: If a change is needed for deployment, it happens in one file, not every component (Header, Footer, Magazines).

Rule 4: The "Health Check" Requirement
Every backend must have a /health or /ping endpoint that returns simple JSON: {"status": "ok"}.

Why: This allows you to visit your-api.railway.app/health in your browser. If you see JSON, the API is up. If you see a Railway error, the problem is deployment, not your code.

Practical Setup: How to stop the "Dead Loops"
Instead of guessing why it fails on Railway, implement this structure. It allows the code to work locally by default but "wake up" correctly on Railway.

1. The Centralized API Client (src/lib/api-client.ts)
Ask the agent to rewrite your API calls using this pattern:

TypeScript

// Define the base URL based on the environment
const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export const apiClient = async (endpoint: string, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    // RULE: If not JSON, throw a readable error before the parser fails
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType}. Check if API URL is correct. Content: ${text.substring(0, 100)}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error at ${url}:`, error);
    throw error;
  }
};
2. The Railway Env Setup
In the Railway Dashboard, you must have these two exact variables:

Backend Service: PORT = 5000 (Railway will assign this, but ensure your code uses process.env.PORT).

Frontend Service: VITE_API_URL = https://your-backend-url.railway.app (No trailing slash).

How to Debug without "Breaking" Local
Local Test: Run npm run dev. It uses the http://localhost:5000 fallback.

Production Simulation: Create a file named .env.production locally. Put your Railway URLs in there. Run npm run build && npm run preview. This lets you test the "Production" version of the code on your own machine before pushing to Railway.