# Troubleshooting White Screen Issue

## Quick Fixes

### 1. Clear Browser Cache & localStorage
Open browser console (F12) and run:
```javascript
localStorage.clear()
location.reload()
```

### 2. Check Browser Console
Press F12 → Console tab → Look for red errors

### 3. Verify Backend is Running
Make sure backend is running on http://localhost:5000
```powershell
curl http://localhost:5000/api/health
```

### 4. Check Network Tab
F12 → Network tab → See if API calls are failing

### 5. Restart Frontend
```powershell
# Stop frontend (Ctrl+C)
# Then restart
cd client
npm run dev
```

## Common Issues

### Issue: White Screen on Load
**Cause**: Authentication redirect loop or missing token

**Fix**: 
1. Go directly to: http://localhost:5173/login
2. Login with: test@example.com / password123

### Issue: CORS Errors
**Cause**: Backend CORS not configured

**Fix**: Backend should already have CORS enabled. Check `server/src/index.js`

### Issue: API Connection Failed
**Cause**: Backend not running or wrong URL

**Fix**: 
1. Start backend: `cd server && npm run dev`
2. Check API_BASE_URL in `client/src/utils/api.js`

## Debug Steps

1. **Open Browser Console** (F12)
2. **Check for errors** - Look for red error messages
3. **Check Network tab** - See if API calls are being made
4. **Check Application tab** → Local Storage → Should see `authToken` after login

## Manual Token Setup (If Login Fails)

If login doesn't work, you can manually set a token:

1. Get token from backend test:
```powershell
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

2. Copy the token from response

3. In browser console (F12):
```javascript
localStorage.setItem('authToken', 'YOUR_TOKEN_HERE')
location.reload()
```














