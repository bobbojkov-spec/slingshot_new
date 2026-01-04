# Railway Environments Quick Guide

## 🎯 Quick Answer: How Do I Know Variables Are Syncing?

### Method 1: Railway Dashboard (Easiest)
1. Go to Railway Dashboard → Your Project
2. **Check the environment dropdown** (top right) - it shows "Production" or "Development"
3. Click **"Variables"** tab
4. You'll see all variables for that specific environment
5. When you add/change a variable, Railway **automatically redeploys** your service

### Method 2: Check Service Logs
1. Go to your service → **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Your app should log environment info (if you add logging)
5. Example: Add `console.log('ENV:', process.env.NODE_ENV)` to see which environment is running

### Method 3: Test with a Dummy Variable
1. Add a test variable: `TEST_ENV="production"` or `TEST_ENV="development"`
2. Add logging in your app: `console.log('Test:', process.env.TEST_ENV)`
3. Deploy to both environments
4. Check logs - they should show different values

---

## 🏗️ Railway Environment Structure

```
Your Railway Project
├── Production Environment
│   ├── Service: "main" (or your production service name)
│   └── Variables: All production variables
│
└── Development Environment
    ├── Service: "dev" (or your dev service name)
    └── Variables: All development variables
```

**Key Point:** Each environment has its **own set of variables**. They don't share!

---

## ✅ How to Set Variables for Development

### Step-by-Step:

1. **Open Railway Dashboard**
   - Go to https://railway.app
   - Select your project

2. **Switch to Development Environment**
   - Look at the top right corner
   - Click the environment dropdown
   - Select **"Development"** (or create it if it doesn't exist)

3. **Add Variables**
   - Click **"Variables"** tab
   - Click **"New Variable"**
   - Enter variable name (e.g., `DATABASE_URL`)
   - Enter variable value
   - Click **"Add"**

4. **Repeat for All Variables**
   - Add all variables from `railway-variables.md`
   - Make sure you're in the **Development** environment (check dropdown!)

5. **Verify**
   - Check the Variables list - all your variables should be there
   - Deploy your service - Railway will automatically use these variables

---

## 🔍 How to Verify Variables Are Different

### Quick Test:

1. **In Production Environment:**
   - Add: `ENV_NAME="production"`

2. **In Development Environment:**
   - Add: `ENV_NAME="development"`

3. **In Your Code:**
   ```typescript
   console.log('Current environment:', process.env.ENV_NAME);
   ```

4. **Deploy Both:**
   - Deploy to production → Check logs → Should see "production"
   - Deploy to development → Check logs → Should see "development"

If you see different values, **variables are syncing correctly!** ✅

---

## ⚠️ Common Mistakes

1. **Setting variables in wrong environment**
   - Always check the environment dropdown before adding variables
   - Production and Development are completely separate

2. **Forgetting to redeploy**
   - Railway auto-redeploys on variable changes, but sometimes you need to manually trigger
   - Go to service → "Deployments" → "Redeploy"

3. **Using same values for both environments**
   - Production and Development should use different databases, buckets, etc.
   - This prevents accidentally affecting production data

4. **Not checking which environment service is linked to**
   - Go to service → "Settings" → Check "Environment"
   - Make sure "dev" service is linked to "Development" environment

---

## 📋 Checklist: Setting Up Development Environment

- [ ] Created "Development" environment in Railway
- [ ] Linked "dev" service to "Development" environment
- [ ] Added all database variables (different from production)
- [ ] Added all storage variables (different buckets from production)
- [ ] Added all Supabase variables (if still using)
- [ ] Added application URLs (dev domain)
- [ ] Added email configuration (dev keys)
- [ ] Set `EXPOSE_LOGIN_CODE="true"` for development
- [ ] Verified variables appear in Railway dashboard
- [ ] Deployed service and checked logs
- [ ] Tested that app works with dev variables

---

## 🚀 Next Steps

1. **Set all variables** in Railway Development environment (see `railway-variables.md`)
2. **Deploy your service** to Development
3. **Test thoroughly** - make sure everything works
4. **When ready**, merge changes to Production
5. **Verify Production** still works correctly

---

## 💡 Pro Tips

- **Use Railway CLI** for bulk variable management:
  ```bash
  railway variables set DATABASE_URL="..." --environment development
  ```

- **Export variables** from one environment to copy to another:
  ```bash
  railway variables --environment production --json > prod-vars.json
  ```

- **Use environment-specific prefixes** in variable names to avoid confusion:
  - `PROD_DATABASE_URL` and `DEV_DATABASE_URL` (if you want to keep both)

- **Document your variables** - Keep `railway-variables.md` updated with actual values (securely!)

