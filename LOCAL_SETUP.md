# Local Development Setup Guide

This guide will help you run the AI Expense Tracker project locally on your machine.

## Prerequisites

✅ **Node.js** (v22.18.0) - Already installed  
✅ **Python** (3.13.6) - Already installed  
⚠️ **MongoDB** - Needs to be set up (see options below)

## Project Structure

- **Client** - React + Vite frontend (port 5173)
- **Server** - Express API backend (port 5000)
- **AI Service** - FastAPI Python service (port 8000)

## Setup Steps

### 1. MongoDB Setup (Choose one option)

#### Option A: Use MongoDB Atlas (Cloud - Recommended for Quick Start)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `server/.env` with your MongoDB Atlas connection string:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-expense-tracker
   ```

#### Option B: Install MongoDB Locally
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start MongoDB service
3. Default connection (already set in `server/.env`): `mongodb://localhost:27017/ai-expense-tracker`

### 2. Environment Variables

The `server/.env` file has been created with default values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-expense-tracker
JWT_SECRET=your-secret-key-change-this-in-production
```

**Update the `MONGO_URI`** if you're using MongoDB Atlas (see Option A above).

### 3. Dependencies

✅ Client dependencies - Already installed  
✅ Server dependencies - Already installed  
✅ AI service dependencies - Already installed

If you need to reinstall:
```bash
# Client
cd client
npm install

# Server
cd server
npm install

# AI Service (Python virtual environment already created)
cd ai
# Virtual environment is already set up in .venv
```

## Running the Project

### Method 1: Using the Batch Script (Windows)

Double-click `start-all.bat` or run in PowerShell:
```powershell
.\start-all.bat
```

This will start all three services in separate windows.

### Method 2: Manual Start (Recommended for Debugging)

Open **3 separate terminal windows**:

#### Terminal 1 - AI Service
```powershell
cd "C:\Users\princ\OneDrive\Desktop\ai expense tracker\ai"
.venv\Scripts\activate
uvicorn categorize:app --reload --port 8000
```

#### Terminal 2 - Server (Backend)
```powershell
cd "C:\Users\princ\OneDrive\Desktop\ai expense tracker\server"
npm run dev
```

#### Terminal 3 - Client (Frontend)
```powershell
cd "C:\Users\princ\OneDrive\Desktop\ai expense tracker\client"
npm run dev
```

### Method 3: Using the Node.js Start Script

```powershell
node start.js
```

## Access Points

Once all services are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000

## Verify Everything is Working

1. **Backend Health Check**: Visit http://localhost:5000/api/health
2. **AI Service Health Check**: Visit http://localhost:8000/health (if using main.py)
3. **Frontend**: Should load at http://localhost:5173

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running (if using local installation)
- Check your `MONGO_URI` in `server/.env`
- Verify network access if using MongoDB Atlas

### Port Already in Use
- Make sure no other services are using ports 5000, 5173, or 8000
- Check running processes: `netstat -ano | findstr :5000`

### Python Virtual Environment Issues
- Recreate the venv: `cd ai && python -m venv .venv`
- Reinstall dependencies: `.venv\Scripts\pip.exe install -r requirements.txt`

### Node Modules Issues
- Delete `node_modules` and reinstall: `rm -r node_modules && npm install`

## Next Steps

- Create a user account via the signup endpoint
- Test the API endpoints using Postman or the frontend
- Connect the frontend to the backend API endpoints

