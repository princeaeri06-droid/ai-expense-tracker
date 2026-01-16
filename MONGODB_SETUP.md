# MongoDB Setup Guide

## The Problem
Your backend is trying to connect to MongoDB at `localhost:27017`, but MongoDB isn't running locally.

Error: `Mongo connection error: connect ECONNREFUSED 127.0.0.1:27017`

## Solution 1: MongoDB Atlas (Cloud - Recommended)

### Step 1: Create Free Account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with email (or use Google/GitHub)

### Step 2: Create a Free Cluster
1. After login, click **"Build a Database"**
2. Choose **FREE** (M0) tier
3. Select a cloud provider and region (closest to you)
4. Click **"Create"** (takes 1-3 minutes)

### Step 3: Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `expenseuser`)
5. Enter a password (save this securely!)
6. Under "Database User Privileges", select **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Configure Network Access
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - Or add your specific IP for better security
4. Click **"Confirm"**

### Step 5: Get Connection String
1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update Your .env File
1. Open `server/.env`
2. Replace the `MONGO_URI` line with:
   ```
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/ai-expense-tracker?retryWrites=true&w=majority
   ```
   **Important**: 
   - Replace `YOUR_USERNAME` with the database user you created
   - Replace `YOUR_PASSWORD` with the password (URL-encode special characters)
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address
   - Keep `/ai-expense-tracker` at the end (database name)

3. Save the file

### Step 7: Restart Backend
The backend will auto-restart (nodemon). You should see:
```
📦 MongoDB connected
🚀 Server ready at http://localhost:5000
```

---

## Solution 2: Install Local MongoDB

### Windows Installation
1. Download MongoDB Community Server:
   https://www.mongodb.com/try/download/community
   
2. Run the installer:
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. Start MongoDB Service:
   ```powershell
   # Check if service is running
   Get-Service MongoDB
   
   # If not running, start it
   Start-Service MongoDB
   ```

4. Verify installation:
   ```powershell
   mongosh mongodb://localhost:27017
   ```

5. Restart your backend - it should connect automatically!

---

## Troubleshooting

### Atlas Connection Issues
- **Wrong username/password**: Double-check your credentials
- **IP not whitelisted**: Add `0.0.0.0/0` in Network Access
- **Password has special characters**: URL-encode them (e.g., `@` becomes `%40`)

### Local MongoDB Issues
- **Service not running**: `Start-Service MongoDB`
- **Port already in use**: Check what's using port 27017
- **Installation failed**: Reinstall MongoDB or check Windows logs

---

## Need Help?
Once you have your MongoDB Atlas connection string, I can help you update the `.env` file!














