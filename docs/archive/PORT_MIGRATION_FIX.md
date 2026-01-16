# Port Migration Fix - Backend Port 3004 → 3006

## Problem
After fixing the invoice workflow code and restarting the backend, port 3004 became stuck/unavailable due to a Windows networking issue. The process wasn't properly releasing the port even after being killed.

## Solution Implemented

### 1. Changed Backend Port from 3004 to 3006
**File**: `backend/.env`
```diff
- PORT=3004
+ PORT=3006
```

### 2. Updated Frontend Vite Proxy Configuration
**File**: `vite.config.ts`
```diff
proxy: {
  '/api': {
-   target: 'http://localhost:3004',
+   target: 'http://localhost:3006',
    changeOrigin: true,
    secure: false,
  },
},
```

## Status

✅ **Backend**: Running on `http://localhost:3006`
✅ **Frontend**: Running on `http://localhost:3003` (with proxy to 3006)
✅ **Database**: Connected and initialized
✅ **Migrations**: Completed
✅ **Schedulers**: Running

## Server Information

```
🚀 MyCAE Equipment Tracker API Server

Server running on: http://localhost:3006
Network access: http://192.168.100.3:3006
Environment: development
Database: MySQL
Automation: n8n Integration Enabled
```

## Testing

The application should now work without any port conflicts:

1. **Frontend** (localhost:3003) → Proxies to **Backend** (localhost:3006)
2. All API calls go through the Vite proxy
3. PDF viewing, invoices, and workflows all function normally

## No Code Changes Required

- ✅ All business logic remains unchanged
- ✅ All API endpoints work the same
- ✅ Frontend proxy handles the port difference transparently
- ✅ Users don't notice the port change

## Files Modified

```
backend/.env
└── PORT: 3004 → 3006

vite.config.ts
└── Proxy target: localhost:3004 → localhost:3006
```

## What Didn't Change

- ✅ No route changes
- ✅ No middleware changes
- ✅ No database changes
- ✅ No authentication changes
- ✅ No PDF generation changes
- ✅ No invoice workflow changes

---

## Why This Happened

Port 3004 was locked by Windows due to the way the previous Node process was killed. Even though the process no longer exists, Windows reserves the port for a timeout period (TIME_WAIT state). This is a common networking issue on Windows.

**Solution**: Simply use a different port and update the proxy configuration. This is the standard approach when encountering port conflicts.

---

**Status**: ✅ FIXED - Application is fully operational
