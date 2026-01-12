# Invoice Approval Workflow - Testing Guide

## Quick Start

### Access Points
- **Frontend:** http://localhost:3003
- **Backend API:** http://localhost:3007
- **Finance Documents:** In main app, navigate to Finance Documents screen

---

## Test Case 1: Create Invoice with Auto-Calculation

### Steps:
1. Login to application
2. Navigate to **Finance Documents** → **Invoices** tab
3. Click **Create New** button
4. Fill in invoice form:
   - Select a project with active Purchase Orders
   - Select invoice date

### Expected Behavior:
- Project total value displays in form helper text
- Remaining percentage shows available allocation

### Test Auto-Calculation:
1. **Enter Percentage First:**
   - Type `30` in percentage field
   - **Expect:** Amount field auto-fills with 30% of project total

2. **Edit Amount:**
   - Delete current amount
   - Type new amount (e.g., `50000`)
   - **Expect:** Percentage field auto-updates to new percentage

3. **Verify Calculation:**
   - If project total = 100,000
   - 30% should = 30,000
   - Reciprocal: 50,000 = 50%

### Submit:
- Click **Save** or **Create Invoice**
- **Expect:** Invoice created with status = "Draft"
- **Verify:** Invoice appears in invoice list with "Draft" badge

---

## Test Case 2: Submit for Approval

### Prerequisites:
- Invoice in "Draft" status

### Steps:
1. Find the draft invoice in the invoices list
2. Click **Submit for Approval** button
3. **Expect:**
   - Status changes to "Pending Approval" (orange badge)
   - Button changes to "Approve"/"Withdraw"
   - Toast notification: "Invoice submitted for approval"

### Verify:
- Invoice no longer editable by non-creators
- "Edit" button hidden for other users
- Timestamp recorded for submission

---

## Test Case 3: Manage Director Approval

### Prerequisites:
- Invoice in "Pending Approval" status
- User with Managing Director role

### Steps:
1. Login as Managing Director (if not already)
2. Navigate to Finance Documents → Invoices
3. Find pending invoice
4. **Verify:** "Approve" button visible (only to MD)
5. Click **Approve** button
6. **Expect:**
   - Status changes to "Approved" (green badge)
   - Button changes to "Mark as Sent"
   - Toast notification: "Invoice approved successfully"

### Verify:
- Approval timestamp recorded
- MD name recorded as approver
- Invoice locked from all editing

---

## Test Case 4: Mark as Sent

### Prerequisites:
- Invoice in "Approved" status

### Steps:
1. Find the approved invoice
2. Click **Mark as Sent** button
3. **Expect:**
   - Status changes to "Sent"
   - Button changes to "Mark as Paid" (disabled)
   - Toast notification: "Invoice marked as sent"

### Verify:
- Invoice remains locked
- No further edits allowed
- "Mark as Paid" button greyed out

---

## Test Case 5: Withdraw from Approval

### Prerequisites:
- Invoice in "Pending Approval" status
- User is the creator

### Steps:
1. Find pending invoice (that you created)
2. Click **Withdraw** button
3. **Expect:**
   - Status changes back to "Draft"
   - Button changes back to "Submit for Approval"
   - Toast notification: "Invoice withdrawn from approval"

### Verify:
- Invoice becomes editable again
- Edit button reappears
- Can submit again after editing

---

## Test Case 6: Permission Restrictions

### Draft Invoice:
- **Owner:** Can edit ✅
- **Other Engineer:** Can edit ✅
- **Manager:** Can edit ✅
- **MD:** Can edit ✅

### Pending Approval Invoice:
- **Owner:** Can edit ✅
- **Other Engineer:** Cannot edit ❌ (greyed out)
- **Manager:** Cannot edit ❌ (greyed out)
- **MD:** Cannot edit ❌ (only approve)

### Approved Invoice:
- **Anyone:** Cannot edit ❌
- **MD:** Cannot edit ❌

---

## Test Case 7: Edit Restrictions

### Steps:
1. Create invoice in Draft status
2. Submit for approval (status → Pending)
3. **As Creator:** Try to edit
   - **Expect:** Edit button visible and functional
4. Change something and save
   - **Expect:** Changes saved, status remains "Pending Approval"

### Verify:
- Only creator can edit pending invoices
- Edit does NOT revert status to Draft
- Can submit multiple times for approval

---

## Troubleshooting

### Issue: Auto-calculation not working
**Solution:**
- Ensure project is selected
- Check project total value displays
- Verify you're entering numbers in the fields
- Try clearing field and re-entering

### Issue: Buttons not appearing
**Solution:**
- Verify user role (especially for "Approve" - requires MD)
- Refresh page to reload component state
- Check invoice status matches expected workflow stage

### Issue: Cannot edit approved invoice
**Expected Behavior:**
- This is correct - approved invoices are locked
- Must withdraw and resubmit to edit

### Issue: Permission denied on approval
**Solution:**
- Verify user has "canApproveInvoices" permission
- Check user role is "Managing Director" or "Admin"
- Contact administrator to grant permission

---

## Key Features to Verify

### ✅ Auto-Calculation
- [x] Percentage → Amount calculation
- [x] Amount → Percentage calculation
- [x] Prevents infinite loops
- [x] Accurate to 2 decimal places
- [x] Uses correct project total value

### ✅ Status Workflow
- [x] Default status = Draft
- [x] Draft → Pending transition works
- [x] Pending → Approved (MD only)
- [x] Approved → Sent transition
- [x] Pending → Draft (withdraw) works

### ✅ Permissions
- [x] MD can approve
- [x] Creator can edit pending
- [x] Non-creators cannot edit pending
- [x] No one can edit approved/sent
- [x] Status buttons hide based on permissions

### ✅ Data Tracking
- [x] creator (created_by) recorded
- [x] approver (approved_by) recorded
- [x] submission time recorded
- [x] approval time recorded

### ✅ User Feedback
- [x] Toast notifications on actions
- [x] Status badges update live
- [x] Buttons enable/disable appropriately
- [x] Error messages on failures

---

## Performance Notes

- Auto-calculation is instant (no server calls)
- Status transitions are quick (< 1 second)
- Data refresh happens automatically
- No page reload required for any action

---

## Data Persistence

All changes persist in MySQL database:
- Invoice status tracked in `status` column
- Creator tracked in `created_by` column
- Approver tracked in `approved_by` column
- Timestamps in `submitted_for_approval_at` and `approved_at`

---

## Next Steps (Optional)

1. Test with different project total values
2. Test with multiple invoices in different statuses
3. Test permission matrix with different user roles
4. Verify database records after each action
5. Test PDF generation when available

---

Generated: 2026-01-08
Last Updated: Invoice Approval Workflow v1.0
