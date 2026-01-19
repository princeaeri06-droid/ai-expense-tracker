# Quick Fix: "Failed to Fetch" Error

## Problem
The login page shows "failed to fetch" because **the backend server is not running**.

## Solution: Start the Backend

### Step 1: Open a NEW Terminal/PowerShell Window

### Step 2: Navigate to Server Directory
```powershell
cd "C:\Users\princ\OneDrive\Desktop\ai expense tracker\server"
```

### Step 3: Start the Backend
```powershell
npm run dev
```

You should see:
```
📦 MongoDB connected
🚀 Server ready at http://localhost:5000
```

### Step 4: Verify Backend is Running
Open another terminal and test:
```powershell
curl http://localhost:5000/api/health
```

Or visit in browser: http://localhost:5000/api/health

### Step 5: Try Login Again
Go back to your frontend (http://localhost:5173/login) and try logging in again.

---

## If Backend Won't Start

### Check MongoDB is Running
```powershell
Get-Service MongoDB
```

If it shows "Stopped", start it:
```powershell
Start-Service MongoDB
```

### Check for Port Conflicts
If port 5000 is already in use:
```powershell
netstat -ano | findstr :5000
```

Kill the process or change PORT in `server/.env`

---

## Keep Both Running

You need **TWO terminal windows**:

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd client
npm run dev
```

Both should be running simultaneously!














