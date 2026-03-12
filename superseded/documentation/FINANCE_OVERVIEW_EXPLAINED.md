# Finance Overview - PO Received & Outstanding Explained

## 📊 Understanding the Columns

### PO Received Column
- **Meaning**: Total value of all Purchase Orders (POs) received from clients for each project
- **Currency**: Converted to MYR (Malaysian Ringgit)
- **Source**: `po.amount_myr_adjusted` or `po.amount_myr` from purchase orders

### Invoiced Column
- **Meaning**: Total value of all invoices sent to clients for each project
- **Currency**: Converted to MYR
- **Source**: `inv.amount_myr` from invoices

### Outstanding Column
- **Meaning**: The amount that has been PO'd but NOT yet invoiced
- **Formula**: `Outstanding = PO Received - Invoiced`
- **Business Logic**: Money that is still owed by the client (work done, not yet billed)

---

## 🐛 Issue: "PO Received" Shows No Value

### Root Causes:

1. **No POs linked to projects**
   - Purchase Orders exist but `project_code` doesn't match any project
   - Result: Projects show RM 0.00

2. **Missing amount fields**
   - `po.amount_myr` and `po.amount_myr_adjusted` are null or 0
   - Result: Calculation returns 0

3. **POs not marked as active**
   - The code filters: `po.project_code === project.projectCode && po.is_active`
   - If `is_active: false`, PO is excluded

### Diagnosing the Issue:

Check your database with this query:

```sql
-- Check if POs have amount_myr values
SELECT
  po.id,
  po.po_number,
  po.project_code,
  po.amount,
  po.currency,
  po.amount_myr,
  po.amount_myr_adjusted,
  po.is_active
FROM purchase_orders po
LIMIT 20;
```

Expected output:
- If `amount_myr` is NULL → Backend calculation issue when creating POs
- If `amount_myr` is 0 → POs created without amount
- If `is_active` is false → POs should be reactivated

---

## 🔍 Backend API Check

The frontend fetches POs from:
```
GET /api/purchase-orders
```

Check the backend endpoint to ensure it returns proper data:

**File**: `backend/src/routes/purchaseOrder.routes.ts`

```bash
# Test the API endpoint
curl http://localhost:5000/api/purchase-orders
```

Expected response should include:
```json
[
  {
    "id": "uuid",
    "po_number": "PO-001",
    "project_code": "MCE-001",
    "amount": 1000,
    "currency": "USD",
    "amount_myr": 4750,
    "amount_myr_adjusted": 4750,
    "is_active": true,
    "status": "received"
  }
]
```

---

## ✅ How "Outstanding" Works

### Example Scenario:

| Item | Amount (MYR) |
|------|---------------|
| PO #001 | RM 10,000 |
| PO #002 | RM 5,000 |
| PO #003 | RM 15,000 |
| **Total PO Received** | **RM 30,000** |

| Item | Amount (MYR) |
|------|---------------|
| INV-001 | RM 12,000 |
| **Total Invoiced** | **RM 12,000** |

| Calculation | Value |
|-----------|--------|
| Outstanding = PO Received - Invoiced | 30,000 - 12,000 |
| **Outstanding** | **RM 18,000** |

### What This Means:
- ✅ **RM 18,000** of work has been completed and PO'd
- ⚠️ **RM 18,000** has NOT been invoiced yet
- 💰 Client still owes this amount
- 📊 Shows "Outstanding" (in orange color if > 0)

---

## 🛠️ Fixing "PO Received" Shows 0

### Fix 1: Check Database Values

Run this SQL query to see actual PO data:

```sql
SELECT
  p.id,
  p.po_number,
  p.project_code,
  pr.title AS project_title,
  p.amount,
  p.currency,
  p.amount_myr,
  p.amount_myr_adjusted,
  p.is_active,
  p.status
FROM purchase_orders p
LEFT JOIN projects pr ON p.project_code = pr.project_code
LIMIT 10;
```

### Fix 2: Update Backend to Return All Required Fields

Ensure backend returns these fields:

**File**: `backend/src/services/purchaseOrder.service.ts`

Check if the `getAllPurchaseOrders` function returns:
- ✅ `amount` (original amount)
- ✅ `currency` (original currency)
- ✅ `amount_myr` (converted MYR)
- ✅ `amount_myr_adjusted` (adjusted MYR)
- ✅ `is_active` (active status)

### Fix 3: Ensure POs are Linked to Projects

Each PO must have a valid `project_code` that matches an existing project:

```sql
-- Find POs with invalid project codes
SELECT po_number, project_code
FROM purchase_orders
WHERE project_code NOT IN (
  SELECT DISTINCT project_code FROM projects
);
```

If this returns rows → Update POs to link to correct projects or delete orphan POs.

### Fix 4: Reactivate Inactive POs

If POs should be showing but are marked inactive:

```sql
-- Mark all POs as active
UPDATE purchase_orders
SET is_active = true
WHERE is_active = false;
```

---

## 📝 Summary: "Outstanding" Explained

**Outstanding** = Money that clients owe you but haven't been invoiced yet.

### Flow:
1. Client sends Purchase Order (PO) → **PO Received** increases
2. Your team does the work
3. You create invoice for the work → **Invoiced** increases
4. Remaining work = **Outstanding** (PO Received - Invoiced)
5. Client pays invoice → **Outstanding** decreases to 0

### Visual Example:

```
Timeline for Project MCE-001:
──────────────────────────────────────────────────────────────────────────

Week 1:  Client sends PO: RM 10,000
          ↓
Week 2:  PO Received = RM 10,000 | Invoiced = RM 0 | Outstanding = RM 10,000

Week 3:  Work completed
          ↓
Week 4:  Send invoice for RM 5,000
          ↓
Week 5:  PO Received = RM 10,000 | Invoiced = RM 5,000 | Outstanding = RM 5,000

Week 6:  Send 2nd invoice for RM 5,000
          ↓
Week 7:  PO Received = RM 10,000 | Invoiced = RM 10,000 | Outstanding = RM 0

Result: Project fully invoiced, no outstanding balance
```

---

## 🎯 Quick Fix Checklist

To resolve "PO Received shows no value":

- [ ] Check database for PO records with NULL `amount_myr`
- [ ] Verify `amount_myr_adjusted` is populated when POs are created
- [ ] Ensure POs have valid `project_code` matching existing projects
- [ ] Check `is_active` flag is set to `true` for relevant POs
- [ ] Verify frontend receives proper data from `/purchase-orders` endpoint
- [ ] Test with browser DevTools to see actual API response

---

## 🔧 Code Locations

### Frontend (Calculations):
- **File**: `src/hooks/useFinanceData.ts`
- **Function**: `calculateProjectSummaries()` (lines 119-232)
- **Key Logic**:
  ```typescript
  // Line 42-47
  const poReceived = projectPOs.reduce((sum, po) => {
    const effectiveAmount = po.amount_myr_adjusted
      ? parseFloat(po.amount_myr_adjusted.toString())
      : parseFloat((po.amount_myr || 0).toString());
    return sum + effectiveAmount;
  }, 0);
  ```

### Backend (API):
- **File**: `backend/src/routes/purchaseOrder.routes.ts`
- **Endpoint**: `GET /api/purchase-orders`
- **Service**: `financeService.getAllPurchaseOrders()`

### Data Structure:
- **File**: `src/types/financeOverview.types.ts`
- **Interface**: `PurchaseOrderData` (lines 73-86)

---

## 💡 Why Outstanding is Important

**Outstanding** is a critical business metric because it shows:

1. **Cash Flow Gap**: Work completed but not yet paid
2. **Revenue Recognition**: Income that's earned but not recorded
3. **Client Payment Status**: How much each client owes
4. **Invoicing Efficiency**: Are you invoicing promptly after POs?

### When Outstanding is High:
- 🚨 **Action Required**: Send invoices to clients
- 💬 **Follow Up**: Contact clients about payment status
- 📅 **Schedule**: Set up regular invoicing (e.g., monthly)

### When Outstanding is Zero:
- ✅ **Good**: All PO'd work has been invoiced
- 💰 **Ready for Billing**: Send payment reminders to clients
- 📊 **Track**: Monitor payment collection

---

Created by: OpenCode Assistant
Purpose: Explaining Finance Overview "PO Received" and "Outstanding" columns
