# Backend Setup Guide

## Quick Start - Running the Backend

### Prerequisites
1. **Node.js** installed (you have v22.18.0 ✅)
2. **MongoDB** - Either:
   - MongoDB Atlas (cloud) - Recommended for quick start
   - Local MongoDB installation

### Step 1: Navigate to Server Directory
```powershell
cd server
```

### Step 2: Verify Environment Variables
The `.env` file should exist in the `server` directory with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-expense-tracker
JWT_SECRET=your-secret-key-change-this-in-production
```

**Important**: If using MongoDB Atlas, update `MONGO_URI` with your connection string:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-expense-tracker
```

### Step 3: Install Dependencies (if not already done)
```powershell
npm install
```

### Step 4: Start the Backend

#### Option A: Development Mode (with auto-reload)
```powershell
npm run dev
```

#### Option B: Production Mode
```powershell
npm start
```

### Step 5: Verify It's Running
You should see:
```
📦 MongoDB connected
🚀 Server ready at http://localhost:5000
```

### Test the Backend
Open your browser or use curl:
- **Health Check**: http://localhost:5000/api/health
- **API Root**: http://localhost:5000/

## Common Issues

### MongoDB Connection Error
**Error**: `Mongo connection error: ...`

**Solutions**:
1. **If using local MongoDB**: Make sure MongoDB service is running
   ```powershell
   # Check if MongoDB is running
   Get-Service MongoDB
   ```

2. **If using MongoDB Atlas**:
   - Verify your connection string in `.env`
   - Make sure your IP is whitelisted in Atlas
   - Check your username/password are correct

3. **Test MongoDB connection**:
   ```powershell
   # If MongoDB is installed locally, test connection
   mongosh mongodb://localhost:27017/ai-expense-tracker
   ```

### Port Already in Use
**Error**: `Port 5000 is already in use`

**Solution**: 
1. Find what's using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Kill the process or change PORT in `.env` to a different port

### Dependencies Not Installed
**Error**: `Cannot find module...`

**Solution**:
```powershell
cd server
npm install
```

## Backend Endpoints

Once running, the backend provides:

- `GET /` - API welcome message
- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires token)
- `GET /api/expenses` - Get all expenses (requires token)
- `POST /api/add-expense` - Add expense (requires token)
- `PATCH /api/expense/:id` - Update expense (requires token)
- `DELETE /api/expense/:id` - Delete expense (requires token)
- `GET /api/secure/ping` - Test authenticated route (requires token)

## Next Steps

1. **Test Authentication**:
   ```powershell
   # Signup
   curl -X POST http://localhost:5000/api/auth/signup -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
   
   # Login (save the token from response)
   curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
   ```

2. **Test with Token**:
   ```powershell
   # Replace YOUR_TOKEN with the token from login
   curl -X GET http://localhost:5000/api/expenses -H "Authorization: Bearer YOUR_TOKEN"
   ```














