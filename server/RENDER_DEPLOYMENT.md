# Render Deployment Guide for API

## Prerequisites
1. GitHub account with your repository
2. Render account (https://render.com)
3. MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Get MongoDB Connection String

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)

## Step 2: Generate JWT Secret

Use this command to generate a strong JWT_SECRET:

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-random.org/base64-generator

**Important:** Copy the generated string - you'll need it for environment variables.

## Step 3: Deploy to Render

1. **Go to https://render.com** and sign in with GitHub
2. **Click "New Web Service"**
3. **Connect your GitHub repository** (select `princeaeri06-droid/ai-expense-tracker`)
4. **Fill in the form:**
   - **Name:** `ai-expense-tracker-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid if you prefer)

5. **Before deploying, add Environment Variables:**
   - Click **Advanced**
   - Click **Add Environment Variable** for each:

   | Key | Value |
   |-----|-------|
   | `JWT_SECRET` | (Paste your generated secret) |
   | `MONGO_URI` | (Your MongoDB Atlas connection string) |
   | `AI_BASE_URL` | `http://localhost:8000` (temporary) |
   | `NODE_ENV` | `production` |

6. **Click "Create Web Service"** and wait for deployment (~3-5 minutes)

## Step 4: Get Your API URL

After deployment succeeds, Render will give you a URL like:
```
https://ai-expense-tracker-api.onrender.com
```

**Copy this URL** - you'll need it in the next steps.

## Step 5: Update Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Update `VITE_API_BASE_URL`:
   - **Value:** `https://ai-expense-tracker-api.onrender.com`
   - Click **Save**
3. Go back to **Deployments** and click **Redeploy** on the latest commit

## Step 6: Test the Deployment

1. Open your Vercel app URL
2. Try to **Sign Up** with test credentials
3. Check if you can **Add Expenses**
4. Check the browser console (F12) for any API errors

## Troubleshooting

### App says "Unable to connect to the server"
- Verify `VITE_API_BASE_URL` is set correctly on Vercel
- Check that the Render API deployment succeeded (look for green status)
- Test the API directly: `https://ai-expense-tracker-api.onrender.com/api/health`

### MongoDB Connection Error
- Verify MONGO_URI is correct
- Check MongoDB Atlas firewall settings (allow all IPs: 0.0.0.0/0)
- Ensure the database user has password with special characters properly escaped

### JWT_SECRET too short error
- JWT_SECRET must be at least 32 characters
- Regenerate using the command above

## Next Steps

After API is deployed, deploy the AI service to Railway (see `ai/RAILWAY_DEPLOYMENT.md`)
