🛠 Deployment & Development Rules
1. Environment Awareness (The "No-Hardcoding" Rule)
NEVER hardcode localhost or specific Railway URLs inside components or logic files.

ALWAYS use a centralized configuration or environment variables (e.g., import.meta.env.VITE_API_URL or process.env.API_URL).

FALLBACK: Always provide a local fallback.

Correct: const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

2. API Communication Protocol
Centralized Client: All fetch/axios calls must pass through a single base configuration file (e.g., api.ts or apiClient.ts).

Response Guard: Before calling .json(), the agent must verify the Content-Type header. If the response is text/html, it must throw a custom error: "Backend returned HTML instead of JSON. Verify API_URL environment variable."

Slash Safety: Use a helper function to join URLs to prevent double slashes (e.g., https://api.com//endpoint).

3. The "Don't Break Local" Debugging Loop
Local Persistence: Before making a change for "Deployment," the agent must verify that the change is conditional and will not prevent the app from running via npm run dev.

Simulation Mode: To debug production issues, instruct the agent to use a .env.production file locally to simulate the Railway environment without actually deploying.

4. Error Logging Standards
Contextual Logs: Every catch block must log the URL it was trying to hit and the status code.

Example: console.error(Failed to fetch from ${url}. Status: ${res.status})

No Silent Failures: Never write empty catch blocks.

5. Railway Checklist (Before suggesting a push)
The agent must verify:

Does the Backend use process.env.PORT?

Does the Frontend have VITE_API_URL set in the Railway dashboard?

Are CORS settings on the backend allowing the Railway frontend domain?

Is the Public Networking domain generated in the Railway settings?

6. Verification Requirement
Before declaring a deployment issue "fixed," the agent must ask the user to run `npm run check` with the target URL (Local or Production) and report the output.

7. Railway Variable Sync Policy
When ready to deploy, verify `VITE_API_URL` against the full Public Domain of the Railway backend (e.g., `https://api-prod.railway.app`). Ensure it includes `/api` or `/health` path logic if prefixing is required.

8. Remote Sanity Check (The "Fail-Fast" Rule)
Before opening the deployed website in a browser, run the check script against the live production URL:
`VITE_API_URL=https://your-backend-on-railway.app/health npm run check`

- If **"DANGER: HTML"**: The problem is in the Railway Backend configuration (Networking/Port mapping). Local code is likely fine.
- If **"✅ JSON correctly"**: Backend is healthy. If the frontend still fails, check the Frontend's environment variable injection.

9. Infrastructure Verification
Before confirming a Railway deployment is successful, the agent must verify the `/health` endpoint and confirm that `services.database` returns `connected`. If it returns `error`, the agent must prioritize checking the `DATABASE_URL` environment variable.

11. Production Origin Sync
Whenever the frontend is deployed to a new Railway URL (like a development branch), the backend allowedOrigins list MUST be updated to include that new URL, or use a wildcard * only during initial testing.

12. Media Signing Protocol
When generating URLs for media, the backend must use the S3Client (or equivalent) to generate a `getSignedUrl`. If the URL appears in the frontend without signature parameters (e.g., `X-Amz-Signature`), the agent must verify that the AWS_SDK is correctly initialized with environment variables. The backend must support multiple naming conventions for S3 credentials: `RAILWAY_STORAGE_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_ID`, or `S3_KEY` (and equivalent for secret key). Logging must confirm that credentials are loaded at server startup.

## Deployment Success Checklist
Before declaring a deployment complete, verify:

1. **Frontend Build:** `VITE_API_URL` is correctly injected during the build phase (via Railway environment variables or build command)
2. **Backend CORS:** `allowedOrigins` includes the Railway production URL (currently using `origin: '*'` for development - tighten to specific URL for production)
3. **Storage:** S3 presigned URLs are being generated correctly using backend environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
4. **Database:** Connection string points to correct Railway database (verify host in startup logs)
5. **Port:** Backend uses `process.env.PORT` for Railway compatibility
6. **Start Script:** `package.json` has `"start": "node server/index.js"`

## Security: Tightening CORS
Once testing is complete, replace the "nuclear" CORS setting:
```javascript
// Development (current):
origin: '*'

// Production (recommended):
origin: 'https://vanityg-development-b090.up.railway.app'
```

## Current Production State ✅
- **Frontend:** Successfully calling Backend
- **Backend:** Successfully talking to Database and S3 Storage  
- **Images:** Loading with presigned URLs
- **Sanity Check:** Run `npm run check` to verify all endpoints

13. Mandatory Database Parity Check
Before submitting any code related to Admin forms, GET/POST controllers, or Database queries, you MUST perform a "Parity Check." You will list all database columns involved and confirm that the frontend data types and backend query parameters match the PostgreSQL schema exactly. You are prohibited from sending stringified "null" values to UUID columns.


14. Context Preservation & Crash Prevention If a task (like Menu Reordering) fails more than twice with a 400 or 404 error, the agent MUST:
Stop modifying the UI.
Print the current Database Schema for the affected table.
Verify the Backend Route exists in the app.ts or routes/ directory.
Rewrite the logic starting from the Database and moving outwards.

Rule 23: Data Persistence Guarantee
The agent is strictly forbidden from creating UI input fields that do not have a verified, matching column in the PostgreSQL schema. Every "Save" operation must be preceded by a check: "Does this column exist in the DB?" If not, the agent must auto-generate the necessary ALTER TABLE script before proceeding.

