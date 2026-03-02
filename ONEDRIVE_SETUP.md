# Quick OneDrive Backup Setup

Get your database backups automatically synced to OneDrive cloud in 3 simple steps.

## Step 1: Find Your OneDrive Path

Open File Explorer and click on **OneDrive** in the left sidebar, then copy the path:

**Common Paths:**
```
C:\Users\YourUsername\OneDrive
C:\Users\YourUsername\OneDrive - YourCompany
```

**Or find it from OneDrive Settings:**
1. Right-click OneDrive icon in system tray (bottom-right)
2. Click "Settings"
3. Go to "Account" tab
4. Copy the path shown

## Step 2: Add Path to .env

Edit `backend\.env` file and add your OneDrive path:

```env
# Backup Configuration
ONEDRIVE_BACKUP_PATH=C:\Users\YourUsername\OneDrive\Documents
```

**Important:**
- Replace `YourUsername` with your actual Windows username
- Don't add a trailing slash
- Use either `/` or `\\` for paths

## Step 3: Test It

Open terminal in the backend folder and run:

```bash
cd backend
npm run backup
```

**Success looks like:**
```
✅ Database dump created successfully (12.45 MB)
✅ Created OneDrive backup directory
✅ Backup copied to OneDrive (12.45 MB)
   Location: C:\Users\...\OneDrive\Documents\MycaeTracker_Backups\...
✅ BACKUP COMPLETED SUCCESSFULLY
```

## Verify in OneDrive

1. Open File Explorer
2. Navigate to OneDrive → Documents
3. You should see a new folder: **MycaeTracker_Backups**
4. Inside are your .sql backup files
5. OneDrive will automatically sync these to the cloud

## What Happens Automatically

Once set up:
- Local backup saved to `MycaeTracker/backups/`
- Copy saved to OneDrive folder
- OneDrive syncs to cloud automatically
- Both locations keep last 30 days of backups
- OneDrive provides version history beyond 30 days

## Schedule Daily Backups (Optional)

Use Windows Task Scheduler to run backups automatically:

1. Open Task Scheduler (`Win + R` → type `taskschd.msc`)
2. Create Basic Task
3. Name: "MyCAE Daily Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start program
   - Program: `C:\Program Files\nodejs\npm.cmd`
   - Arguments: `run backup`
   - Start in: `C:\Users\YourUsername\Documents\MycaeTracker\backend`

## Benefits of OneDrive Backups

✅ **Automatic cloud sync** - Set it and forget it
✅ **Access anywhere** - Download backups from any device
✅ **Version history** - OneDrive keeps old versions
✅ **Ransomware protection** - Cloud copy safe from local attacks
✅ **Disaster recovery** - Fire, theft, hardware failure? Your data is safe
✅ **No extra cost** - Uses your existing Microsoft 365 subscription

## Quick Commands

```bash
# Create backup (also copies to OneDrive)
npm run backup

# Restore from backup (shows both local and OneDrive backups)
npm run restore
```

## Troubleshooting

**"OneDrive path not configured"**
→ Add `ONEDRIVE_BACKUP_PATH` to `backend/.env`

**Backups not appearing in OneDrive**
→ Check OneDrive is running (icon in system tray)
→ Verify path in .env is correct
→ Check OneDrive sync status

**"Permission denied" error**
→ Make sure OneDrive folder is accessible
→ Check folder permissions

## Need Help?

See the full [BACKUP_GUIDE.md](BACKUP_GUIDE.md) for detailed instructions, troubleshooting, and best practices.
