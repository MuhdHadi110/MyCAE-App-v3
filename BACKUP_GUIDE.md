# MyCAE Tracker - Database Backup Guide

Complete guide for backing up and restoring your MyCAE Tracker database with OneDrive integration.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Setup OneDrive Integration](#setup-onedrive-integration)
3. [Manual Backup](#manual-backup)
4. [Restore from Backup](#restore-from-backup)
5. [Automated Backups](#automated-backups)
6. [Backup Locations](#backup-locations)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### First-Time Setup

1. **Configure OneDrive Path**
   ```bash
   # Edit backend/.env and set your OneDrive path
   ONEDRIVE_BACKUP_PATH=C:\Users\YourUsername\OneDrive\Documents
   ```

2. **Create Your First Backup**
   ```bash
   cd backend
   npm run backup
   ```

3. **Verify Backup**
   - Check `backups/` folder for local copy
   - Check `OneDrive\Documents\MycaeTracker_Backups\` for cloud copy

---

## Setup OneDrive Integration

### Step 1: Find Your OneDrive Path

**Windows:**
1. Open File Explorer
2. Click on "OneDrive" in the left sidebar
3. Copy the path from the address bar (e.g., `C:\Users\YourUsername\OneDrive`)

**Alternative Method:**
1. Right-click the OneDrive icon in the system tray
2. Click "Settings"
3. Go to "Account" tab
4. See the path listed

### Step 2: Update .env File

Edit `backend/.env` and add your OneDrive path:

```env
# Backup Configuration
ONEDRIVE_BACKUP_PATH=C:\Users\YourUsername\OneDrive\Documents
```

**Important:**
- Use forward slashes `/` or double backslashes `\\`
- Do NOT add trailing slash
- The script will create `MycaeTracker_Backups` folder automatically

### Step 3: Test the Setup

```bash
cd backend
npm run backup
```

You should see:
```
✅ Database dump created successfully (X.XX MB)
✅ Created OneDrive backup directory: ...
✅ Backup copied to OneDrive (X.XX MB)
✅ BACKUP COMPLETED SUCCESSFULLY
```

---

## Manual Backup

### Create a Backup

```bash
cd backend
npm run backup
```

### What Happens:
1. Creates MySQL dump of current database
2. Saves to `backups/mycae_tracker_YYYY-MM-DD_HH-MM.sql`
3. Copies to OneDrive `MycaeTracker_Backups/` folder
4. OneDrive automatically syncs to cloud
5. Cleans up backups older than 30 days

### Backup File Naming:
```
mycae_tracker_2026-01-15_14-30.sql
              ↑         ↑    ↑
           Year-Month-Day Hour:Minute
```

---

## Restore from Backup

### Interactive Restoration

```bash
cd backend
npm run restore
```

### Steps:
1. **Select Backup**
   - Script shows all available backups (local + OneDrive)
   - Choose by number

2. **Confirm Restoration**
   - Type `RESTORE` to confirm
   - Database will be replaced

### Example Output:
```
📋 Available Backups:

  #  | Source    | Date                | Size     | Filename
-----|-----------|---------------------|----------|------------------------
  1  | OneDrive  | 1/15/2026, 2:30 PM | 12.45 MB | mycae_tracker_2026-01-15_14-30.sql
  2  | Local     | 1/14/2026, 9:00 AM | 12.32 MB | mycae_tracker_2026-01-14_09-00.sql

Select backup number (or 0 to cancel): 1

⚠️  WARNING: This will REPLACE ALL current data!
Type "RESTORE" to confirm: RESTORE

✅ Database restored successfully
```

---

## Automated Backups

### Option 1: Windows Task Scheduler (Recommended)

**Create Daily Backup Task:**

1. **Open Task Scheduler**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create New Task**
   - Click "Create Basic Task"
   - Name: `MyCAE Tracker Daily Backup`
   - Description: `Automated database backup to OneDrive`

3. **Set Trigger**
   - Daily at 2:00 AM (or your preferred time)

4. **Set Action**
   - Action: Start a program
   - Program: `C:\Program Files\nodejs\npm.cmd`
   - Arguments: `run backup`
   - Start in: `C:\Users\YourUsername\Documents\MycaeTracker\backend`

5. **Finish**
   - Check "Open Properties" before clicking Finish
   - Under "General" tab: Check "Run whether user is logged on or not"

### Option 2: Manual npm Script

Add to `backend/package.json`:

```json
{
  "scripts": {
    "backup:auto": "node-cron '0 2 * * *' 'npm run backup'"
  }
}
```

Then run in a persistent terminal:
```bash
npm run backup:auto
```

---

## Backup Locations

### Local Backups

**Path:** `MycaeTracker/backups/`

**Purpose:**
- Quick local restoration
- Immediate access
- Development backups

**Retention:** 30 days

### OneDrive Backups

**Path:** `OneDrive/Documents/MycaeTracker_Backups/`

**Purpose:**
- Off-site protection
- Cloud redundancy
- Access from any device
- Automatic versioning by OneDrive

**Retention:** 30 days (older versions available in OneDrive version history)

### Backup Strategy (3-2-1 Rule)

✅ **3** copies of your data:
- 1 live database
- 1 local backup
- 1 OneDrive backup

✅ **2** different storage types:
- Local disk
- Cloud storage

✅ **1** off-site backup:
- OneDrive (cloud)

---

## Troubleshooting

### "mysqldump: command not found"

**Solution:** MySQL is not in your PATH

**Windows Fix:**
1. Find MySQL bin folder: `C:\Program Files\MySQL\MySQL Server 8.0\bin`
2. Add to System PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings
   - Environment Variables
   - Edit "Path"
   - Add MySQL bin path

### "Access Denied" Error

**Solution:** Incorrect database credentials

**Fix:**
1. Check `backend/.env` file
2. Verify `DB_USER` and `DB_PASSWORD`
3. Test connection: `mysql -u root -p`

### "OneDrive path not configured"

**Solution:** Add OneDrive path to .env

**Fix:**
```env
ONEDRIVE_BACKUP_PATH=C:\Users\YourUsername\OneDrive\Documents
```

### Backup File is Empty (0 KB)

**Possible Causes:**
- Database connection failed
- mysqldump error
- No data in database

**Fix:**
1. Check database connection
2. Run manually: `mysqldump -u root -p mycae_tracker > test.sql`
3. Check for errors

### "Cannot find module" Error

**Solution:** Dependencies not installed

**Fix:**
```bash
cd backend
npm install
```

### OneDrive Not Syncing

**Check:**
1. OneDrive app is running (system tray)
2. You have internet connection
3. OneDrive has enough space
4. Folder is not excluded from sync

**Force Sync:**
- Right-click OneDrive icon
- Click "Sync now"

---

## Best Practices

### 1. Regular Backups
- Schedule daily automated backups
- Verify backups weekly
- Test restoration quarterly

### 2. Before Major Changes
Always create manual backup before:
- Software updates
- Database migrations
- Bulk data imports
- Schema changes

```bash
cd backend
npm run backup
```

### 3. Monitor Backup Size
- Check disk space regularly
- Monitor OneDrive storage quota
- Large growth = investigate data issues

### 4. Test Restorations
Quarterly test:
1. Note current data state
2. Restore from yesterday's backup
3. Verify data integrity
4. Restore back to current

### 5. Keep Multiple Copies
Don't rely on automated cleanup:
- Manually copy important backups to external drive
- Keep monthly snapshots separately
- Archive before major milestones

---

## Emergency Restoration

### Total Data Loss Scenario

1. **Stop the backend server**
   ```bash
   # Press Ctrl+C in terminal running backend
   ```

2. **Access OneDrive backups**
   - Open OneDrive folder
   - Navigate to `Documents/MycaeTracker_Backups/`
   - Find latest backup file

3. **Run restoration**
   ```bash
   cd backend
   npm run restore
   ```

4. **Select newest backup**

5. **Confirm restoration**

6. **Restart backend**
   ```bash
   npm run dev
   ```

7. **Verify data in frontend**

---

## Support

### Getting Help

If you encounter issues:

1. **Check logs** in terminal output
2. **Verify configurations** in `backend/.env`
3. **Test MySQL connection** manually
4. **Check OneDrive sync status**

### Backup Verification

To verify backup integrity:

```bash
# Check local backup
ls -lh backups/

# Check OneDrive backup (Windows)
dir "C:\Users\YourUsername\OneDrive\Documents\MycaeTracker_Backups"

# Test restore (without confirmation)
# Just run and press 0 to cancel
cd backend
npm run restore
```

---

## Quick Reference

### Commands

```bash
# Create backup
cd backend && npm run backup

# Restore from backup
cd backend && npm run restore

# View backups
ls -lh backups/
```

### File Paths

```
Local:    MycaeTracker/backups/
OneDrive: OneDrive/Documents/MycaeTracker_Backups/
Config:   backend/.env
```

### Retention Policy

- **Local:** 30 days
- **OneDrive:** 30 days + version history
- **Manual:** Keep important backups externally

---

## Version History

- **v1.0** - Initial backup system with OneDrive integration
- Added automated cleanup
- Added interactive restoration
