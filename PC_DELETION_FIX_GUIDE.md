# PC Deletion Fix - Implementation Guide

## Problem Summary

**Issue**: Deleted PCs were reappearing after page refresh.

**Example**: You delete PC3 → it disappears from the UI → refresh the page → PC3 reappears ❌

## Root Cause

The backend GET `/api/computers` endpoint was returning **ALL computers including decommissioned ones**.

**What was happening**:

```
User deletes PC3
    ↓
Backend marks status='DECOMMISSIONED' ✓
    ↓
Frontend removes PC from state immediately ✓
    ↓
User refreshes page
    ↓
Frontend calls GET /api/computers
    ↓
Backend returns ALL PCs (including PC3 with status='DECOMMISSIONED') ❌
    ↓
Frontend displays PC3 again ❌
```

## Solution Applied

Modified [backend/src/routes/computer.routes.ts:18-66](backend/src/routes/computer.routes.ts#L18-L66)

### Code Changes

**Added filter to exclude decommissioned PCs by default:**

```typescript
// Line 20: Added includeDecommissioned parameter
const { status, type, assignedTo, search, limit = 100, offset = 0, includeDecommissioned = 'false' } = req.query;

// Lines 27-30: New filter that excludes decommissioned PCs
if (includeDecommissioned !== 'true') {
  query = query.where('computer.status != :decommissioned', { decommissioned: ComputerStatus.DECOMMISSIONED });
}
```

### What This Does

✅ **Decommissioned PCs are hidden by default** - Users won't see deleted PCs after refresh
✅ **Admin can still view them** - Optional parameter: `?includeDecommissioned=true`
✅ **Maintains soft-delete** - PCs stay in database for audit trail
✅ **Data integrity preserved** - No orphaned references or relationships

## How to Apply the Fix

### Option 1: Automatic (Using Nodemon)

If your backend is running with nodemon (which watches for file changes):

1. **File is already modified** - [backend/src/routes/computer.routes.ts](backend/src/routes/computer.routes.ts) has been updated
2. **Nodemon auto-reloads** - Just wait a moment, the server will restart with the changes
3. **Test in UI** - Delete a PC and refresh - it should stay deleted ✓

### Option 2: Manual Restart

1. **Stop backend server** - Kill the current process running on port 3002
2. **Restart backend**:
   ```bash
   cd backend
   npm run dev
   ```
3. **Verify startup** - You should see:
   ```
   ✅ Database connection established successfully
   ✅ Migrations completed successfully
   ✅ ✅ Server running on port 3002
   ```

### Option 3: Check Current Status

To verify if the fix is active, the backend logs should show:

```
✅ Database connection established successfully
✅ Migrations completed successfully
✅ Database initialized successfully
```

Then the new filter will automatically exclude decommissioned PCs from API responses.

## Testing the Fix

### Test Case 1: Delete PC

1. Navigate to PC Assignment Tracking page
2. Click **Delete** button on any PC (e.g., PC3)
3. Confirm deletion in dialog
4. **Expected**: PC3 disappears immediately ✓
5. **Refresh page** (F5 or Cmd+R)
6. **Expected**: PC3 still gone ✓

### Test Case 2: View Deleted PCs (Admin)

1. Open browser DevTools → Network tab
2. Delete a PC
3. Observe the API call: `GET /api/computers`
4. To include decommissioned PCs, manually call:
   ```
   GET /api/computers?includeDecommissioned=true
   ```
5. Deleted PCs will appear with `status: 'decommissioned'`

## Database Impact

No database changes needed. The fix is purely in the API filter logic:

- **PCs are still marked as DECOMMISSIONED** in the database
- **Audit trail is preserved** - you can query decommissioned PCs if needed
- **No data loss** - soft delete remains intact

## Frontend Impact

No frontend changes needed. The fix works transparently:

- Frontend `deletePC()` removes PC from state ✓
- On page refresh, backend now correctly excludes it ✓
- `pcStore.tsx` doesn't need changes

## API Changes

### GET /api/computers

**New optional parameter:**
- `?includeDecommissioned=true` - Show decommissioned PCs (default: false)

**Example:**
```bash
# Show only active PCs (DEFAULT)
GET /api/computers

# Show all PCs including decommissioned
GET /api/computers?includeDecommissioned=true

# Show only PCs assigned to user with decommissioned included
GET /api/computers?assignedTo=USER_ID&includeDecommissioned=true
```

## How Soft-Delete Works

The delete operation doesn't remove the PC, it marks it as decommissioned:

```typescript
// DELETE /api/computers/:id handler (lines 204-233)
router.delete('/:id', async (req, res) => {
  // Mark as decommissioned instead of deleting
  computer.status = ComputerStatus.DECOMMISSIONED;
  computer.decommission_date = new Date();
  await computerRepo.save(computer);

  res.json({ message: 'Computer decommissioned successfully' });
});
```

**Benefits of Soft-Delete:**
- ✅ Referential integrity - no broken foreign keys
- ✅ Audit trail - can see when PCs were decommissioned
- ✅ Recovery possible - can reactivate if needed
- ✅ Data safety - prevents accidental loss

## Status Values

The system uses 4 status values:

| Status | Meaning | API Query | UI Display |
|--------|---------|-----------|-----------|
| `ACTIVE` | Computer is usable | Shown by default | Available or Assigned |
| `INACTIVE` | Not in use | Shown by default | Gray out |
| `IN_REPAIR` | Under maintenance | Shown by default | Yellow warning |
| `DECOMMISSIONED` | Deleted/EOL | Hidden by default | Hidden (unless includeDecommissioned=true) |

## Verification Checklist

- [x] Code modified: [backend/src/routes/computer.routes.ts](backend/src/routes/computer.routes.ts#L27-L30)
- [x] Filter added: `computer.status != DECOMMISSIONED`
- [x] Optional parameter added: `includeDecommissioned`
- [ ] Backend restarted (if using hot-reload, automatic)
- [ ] Frontend refreshed (hard refresh: Ctrl+Shift+R)
- [ ] Test deletion and verify PC stays deleted after refresh

## Common Issues & Solutions

### Issue: PC still appears after refresh

**Possible causes:**
1. Backend hasn't reloaded the changes
2. Browser cached the old response
3. Database query returned decommissioned PC

**Solutions:**
- Hard refresh browser: `Ctrl+Shift+R` (or Cmd+Shift+R on Mac)
- Restart backend server: Kill process on port 3002 and restart
- Check network tab: Verify API response doesn't include the deleted PC

### Issue: Can't find deleted PC in archive

**Solution:**
Use the admin parameter to include decommissioned PCs:
```
GET /api/computers?includeDecommissioned=true
```

### Issue: Deleted PC still shows in user's assigned PCs

**Reason:** The decommissioned filter only applies to the main endpoint, not the "assigned to user" endpoint

**Check endpoint:** `GET /api/computers/assigned/:userId` (line 239)
- This endpoint filters by `assigned_to` and `status = ACTIVE`
- Decommissioned PCs won't appear here

## Related Files

- [backend/src/routes/computer.routes.ts](backend/src/routes/computer.routes.ts) - API endpoints
- [backend/src/entities/Computer.ts](backend/src/entities/Computer.ts) - Data model
- [src/store/pcStore.ts](src/store/pcStore.ts) - Frontend state management
- [src/screens/PCAssignmentScreen.tsx](src/screens/PCAssignmentScreen.tsx) - UI component

## Next Steps

1. **Verify backend is running** - Check if you see "listening on port 3002"
2. **Clear browser cache** - Hard refresh the page (Ctrl+Shift+R)
3. **Test deletion** - Delete a PC and refresh to verify it stays deleted
4. **Document in changelog** - Note the fix for future reference

## Summary

The fix prevents decommissioned PCs from appearing in the main PC list after deletion and refresh. The soft-delete mechanism is preserved for data integrity and audit purposes. Admin users can still view decommissioned PCs using the optional parameter if needed.

**Status**: ✅ **READY FOR TESTING**
