1. The Environment Variable Strategy
Railway prioritizes variables set in its dashboard over your local .env file. For the Main/Production environment, ensure these are set directly in the Railway UI:

DATABASE_URL: Points to your Production Postgres instance.

AWS_BUCKET_NAME: Points to your Production bucket.

NODE_ENV: Must be set to production.

SESSION_SECRET: Use a different, long random string than the one in Dev to ensure sessions don't overlap.

2. Migration: Moving Data from Dev to Main
Since your Production environment is currently empty, you need to move your work over once.

A. Moving the Database (The SQL Dump)
You need to move your table structures and the content you've created (like the Highlights and Pages) to the production DB.

Export Dev: Open your Dev database (via Railway's "Data" tab or a tool like DBeaver) and export the tables: highlight_articles, pages, images, and magazines.

Import to Main: Run that SQL script against your Production database.

Tip: If the Agent is "pretending" again, this is a good time to verify that the highlight_articles table exists in Production with all the columns we discussed.

B. Moving the Bucket Content
Download the uploads folder from your Dev bucket.

Upload those files to the same path in your Production bucket.

Crucial Check: Since we fixed your code to save File Keys (the filename) instead of full URLs, the Main site will automatically look for those filenames in the Production bucket.

3. The Launch Procedure (The "Promotion")
When you are ready to go live on YOUR DOMAIN, follow this Git flow:

Sync Main with Dev:

Bash

git checkout main
git merge dev
git push origin main
Verify the Build: Railway will detect the push to main and start a "Production" build using your production variables.

Sanity Check: Visit the live URL. Log in to the Admin at the live URL and confirm that changes there do not show up on your Local/Dev site.

4. Returning to the "Dev" Workflow
Once Main is live, you should never work directly on the main branch.

Switch back: git checkout dev.

Separation: Your Local/Dev environment will continue to use your local .env and Dev database.

Testing: When you want to add a new feature , build it in dev, test it on your dev URL, and only merge to main when it's perfect.

5. Final Warning for the Agent
Before that first merge to main, give the agent this "Safety Check" prompt:

Prompt: "We are preparing for the first merge to the main branch (Production).

Static References: Search the entire project for any hardcoded strings containing localhost, 5173, or your Railway Dev URL. Replace them with environment variables or relative paths.

Database Migration Check: Confirm that the backend uses process.env.DATABASE_URL.

Storage Check: Confirm that the storage utility uses process.env.AWS_BUCKET_NAME so it switches to the Production bucket automatically."

Would you like me to help you write a small "Health Check" script that you can run after the launch to verify that the Production site is correctly talking to the Production database?