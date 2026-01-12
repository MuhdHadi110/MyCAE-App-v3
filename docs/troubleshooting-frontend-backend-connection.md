# Troubleshooting: Frontend-Backend Connection Issues

## Issue: Frontend Cannot Connect to Backend

### Problem Description
The frontend application fails to communicate with the backend API, resulting in failed API calls and inability to load data.

### Root Causes and Solutions

#### 1. Backend Server Not Running
**Symptoms**: API calls return network errors or timeouts.

**Solution**:
- Ensure the backend is started: `cd backend && npm run dev`
- Check that the server starts successfully without errors.

#### 2. Port Conflicts
**Symptoms**: Backend fails to start with "EADDRINUSE" error.

**Solution**:
1. Identify the conflicting process:
   ```bash
   netstat -ano | findstr :3000
   ```
   Note the PID and check Task Manager or use:
   ```bash
   taskkill /PID <PID> /F
   ```

2. Alternatively, change the backend port:
   - Edit `backend/.env` and change `PORT=3000` to `PORT=3002` (or another available port)
   - Update `vite.config.ts` proxy target to match: `target: 'http://localhost:3002'`
   - Restart both frontend and backend servers

#### 3. Database Connection Issues
**Symptoms**: Backend starts but API calls fail with database errors.

**Solution**:
- Ensure MySQL is installed and running
- Verify database credentials in `backend/.env`
- Run database setup: `setup-local-db.bat`
- Check database exists: `mysql -u root -e "SHOW DATABASES;"`

#### 4. CORS Issues
**Symptoms**: Browser console shows CORS errors.

**Solution**:
- Verify CORS configuration in `backend/src/server.ts`
- Ensure frontend URL is allowed in CORS origins
- Check that credentials are properly set

#### 5. Proxy Configuration Issues
**Symptoms**: Frontend makes direct calls instead of proxying.

**Solution**:
- Verify `vite.config.ts` has correct proxy configuration
- Ensure baseURL in `src/services/api.service.ts` is `/api`
- Check that Vite dev server is running on correct port (3001)

### Configuration Files

#### backend/.env
```env
# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3001

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mycae_tracker
DB_USER=root
DB_PASSWORD=
```

#### vite.config.ts
```typescript
server: {
  host: "0.0.0.0",
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:3002',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

### Testing the Connection

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Open browser to `http://localhost:3001`
4. Check browser console for errors
5. Verify API calls in Network tab

### Prevention

- Always check for port conflicts before starting servers
- Use consistent port configurations across team members
- Document any port changes in team communication
- Regularly clean up unused processes

### Recent Changes Made

- Changed backend port from 3000 to 3002 due to port conflict
- Updated Vite proxy to target localhost:3002
- Frontend now successfully connects to backend API

Date: 2025-12-19
Fixed by: AI Assistant