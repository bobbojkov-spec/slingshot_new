2. Add it to your package.json
To make it easy to run, add this line to your scripts section:


"scripts": {
  "dev": "vite",
  "build": "vite build",
  "check": "node check-env.js"
}

3. How to use this for Deployment Debugging
Instead of pushing to Railway to see if it works, you can now test your Production URL from your Local machine:

Open your terminal.

Run: VITE_API_URL=https://your-api-production.railway.app npm run check

If it fails here: The problem is your Railway Backend settings (CORS, Networking, or the server crashed).

If it passes here but fails in the browser: The problem is your Frontend environment variable setup in the Railway Dashboard.

4. Professional Rule for the Agent
Add this to your ROLES_AND_RULES.md:

Rule 6: Verification Requirement Before declaring a deployment issue "fixed," the agent must ask the user to run npm run check with the production URL and report the output.