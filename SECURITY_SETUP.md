# Security Packages Installation Guide

## Install Required Security Packages

Run this command in the server directory:

```bash
cd server
npm install helmet express-rate-limit express-mongo-sanitize xss-clean
```

## Update server/src/index.js

Add these imports at the top:
```javascript
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import { authLimiter, apiLimiter, aiLimiter } from './middleware/rateLimiter.js'
```

Add these middleware after `app.use(cors(corsOptions))`:
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false
}))

// Prevent NoSQL injection
app.use(mongoSanitize())

// Prevent XSS attacks
app.use(xss())
```

Update the auth routes:
```javascript
app.use('/api/auth', authLimiter, authRoutes)
```

Update the AI routes:
```javascript
app.use('/api/ai', aiLimiter, aiRoutes)
```

Update other routes:
```javascript
app.use('/api', apiLimiter, healthRoutes)
app.use('/api', apiLimiter, expenseRoutes)
app.use('/api/categories', apiLimiter, categoryRoutes)
```

## Generate Strong JWT Secret

Run this command to generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and add it to your production .env file:
```
JWT_SECRET=paste_the_generated_secret_here
```

## Create Production Environment File

Create `server/.env` (NOT .env.example):
```
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_generated_64_char_secret
FRONTEND_URL=https://your-frontend-domain.com
AI_BASE_URL=http://localhost:8000
```

⚠️ **IMPORTANT**: Never commit the `.env` file to Git!

## Frontend Production Build

Create `client/.env.production`:
```
VITE_API_BASE_URL=https://your-backend-api-domain.com
```

Then build:
```bash
cd client
npm run build
```

The `dist` folder will contain your production-ready frontend.

## Testing Before Deployment

1. Start the server with production env:
   ```bash
   cd server
   NODE_ENV=production npm start
   ```

2. Test API endpoints
3. Verify rate limiting works
4. Check security headers
5. Test authentication flow

## Deployment Recommendations

### Backend:
- **Railway**: `railway up` (easiest)
- **Render**: Connect GitHub repo
- **Fly.io**: `fly launch`
- **Heroku**: `git push heroku main`

### Frontend:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop `dist` folder
- **Cloudflare Pages**: Connect GitHub repo

### Database:
- **MongoDB Atlas**: Free tier available
- Enable IP whitelist (add your deployment platform IPs)
- Regular automated backups

## Post-Deployment Checklist

✅ Environment variables set correctly
✅ CORS configured with actual domain
✅ SSL/HTTPS enabled
✅ Database connection working
✅ All API endpoints responding
✅ Rate limiting active
✅ Security headers present
✅ No console errors in browser
✅ Authentication working
✅ File uploads (if any) working

## Monitoring

Set up monitoring services:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Analytics**: Google Analytics
- **Logs**: Check platform-specific logging

## Security Maintenance

- Run `npm audit` regularly
- Update dependencies monthly
- Rotate JWT secret every 90 days
- Monitor failed login attempts
- Review access logs weekly
