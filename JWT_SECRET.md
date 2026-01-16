# 🔐 Your JWT Secret (Generated)

Copy this and add to `server/.env`:

```
JWT_SECRET=d37d8fb8f98cb0f90aebf409bf286937c1d2382c63c3ccbf3cef0b84f8d1a503b200caa5abbdd239d9bbf3a3fe5fde8630e0878b84befe437000a17440dcbc1b9
```

## Instructions

1. Open `server/.env`
2. Find the line: `JWT_SECRET=generate_a_strong_64_char_secret_here_with_node_command`
3. Replace it with the secret above
4. Save the file
5. Restart the server: `npm run dev`

## Verify It Works

After updating, you should see:
- ✅ No error about JWT_SECRET being missing
- ✅ Server starts successfully
- ✅ Authentication works normally
- ✅ No "Invalid token" errors

---

**Security Note:** 
- This secret is displayed here for setup purposes only
- Change it periodically (every 90 days)
- Never share it publicly
- Users will need to re-login after changing the secret
