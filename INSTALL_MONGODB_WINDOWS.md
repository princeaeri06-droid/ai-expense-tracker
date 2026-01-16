# Install MongoDB on Windows - Step by Step Guide

## Step 1: Download MongoDB Community Server

1. **Go to MongoDB download page:**
   https://www.mongodb.com/try/download/community

2. **Select:**
   - Version: Latest (7.0.x or 8.0.x)
   - Platform: Windows
   - Package: MSI
   - Click **"Download"**

## Step 2: Install MongoDB

1. **Run the downloaded installer** (mongodb-windows-x86_64-*.msi)

2. **Installation Wizard:**
   - Click **"Next"** on welcome screen
   - Accept the license agreement
   - Choose **"Complete"** installation (recommended)
   - **IMPORTANT**: Check **"Install MongoDB as a Service"**
   - Select **"Run service as Network Service user"**
   - Check **"Install MongoDB Compass"** (optional GUI tool - helpful!)
   - Click **"Install"**

3. **Wait for installation to complete** (2-5 minutes)

## Step 3: Verify Installation

Open PowerShell and run:

```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# Check MongoDB version
mongod --version
```

**Expected output:**
- Service status should show "Running"
- Version should display MongoDB version number

## Step 4: Start MongoDB Service (if not running)

If the service isn't running:

```powershell
# Start MongoDB service
Start-Service MongoDB

# Verify it's running
Get-Service MongoDB
```

## Step 5: Test MongoDB Connection

```powershell
# Connect to MongoDB shell
mongosh
```

You should see MongoDB shell prompt. Type `exit` to quit.

## Step 6: Update Your .env File

Your `server/.env` file should already have:
```
MONGO_URI=mongodb://localhost:27017/ai-expense-tracker
```

This is correct for local MongoDB!

## Step 7: Start Your Backend

```powershell
cd server
npm run dev
```

You should now see:
```
📦 MongoDB connected
🚀 Server ready at http://localhost:5000
```

## Troubleshooting

### MongoDB Service Won't Start
```powershell
# Check service status
Get-Service MongoDB

# View service logs
Get-EventLog -LogName Application -Source MongoDB -Newest 10

# Try starting manually
Start-Service MongoDB
```

### Port 27017 Already in Use
```powershell
# Find what's using the port
netstat -ano | findstr :27017

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### MongoDB Not in PATH
If `mongod` command doesn't work, add MongoDB to PATH:
- MongoDB is usually installed at: `C:\Program Files\MongoDB\Server\<version>\bin`
- Add this to your system PATH environment variable

## Alternative: Quick Install via Chocolatey

If you have Chocolatey installed:

```powershell
choco install mongodb
```

Then start the service:
```powershell
Start-Service MongoDB
```














