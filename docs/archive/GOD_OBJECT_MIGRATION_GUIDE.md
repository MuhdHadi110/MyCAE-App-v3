# God Object Elimination - Migration Guide

## **Executive Summary**

**Problem:** `api.service.ts` is a god object with 114+ methods handling 10+ domains  
**Solution:** Migrate to domain-specific services (authService, inventoryService, financeService, etc.)  
**Status:** Migration in progress - 2 screens complete, 29 files remaining

---

## **✅ COMPLETED MIGRATIONS**

### **1. InventoryScreen.tsx** ✅
- **Migrated to:** `inventoryService`
- **Methods used:** bulkCreateInventoryItems, createBulkCheckout, checkInBulk, createInventoryItem, createSingleCheckout, checkInSingle, deleteInventoryItem, updateInventoryItem
- **Status:** Complete and tested
- **File:** `src/screens/InventoryScreen.tsx`

### **2. FinanceDocumentsScreen.tsx** ✅
- **Migrated to:** `financeService`
- **Status:** Complete
- **File:** `src/screens/FinanceDocumentsScreen.tsx`

---

## **🔄 PENDING MIGRATIONS**

### **Modals (13 files)**
```
src/components/modals/AddInvoiceModal.tsx → financeService
src/components/modals/AddIssuedPOModal.tsx → financeService
src/components/modals/AddReceivedPOModal.tsx → financeService
src/components/modals/AddTeamMemberModal.tsx → teamService
src/components/modals/AdjustMYRModal.tsx → financeService
src/components/modals/ChangePasswordModal.tsx → authService
src/components/modals/CreatePORevisionModal.tsx → financeService
src/components/modals/EditTeamMemberModal.tsx → teamService
src/components/modals/ForgotPasswordModal.tsx → authService
src/components/modals/PasswordChangeModal.tsx → authService
src/components/modals/PORevisionHistoryModal.tsx → financeService
```

### **Screens (8 files)**
```
src/screens/CheckoutsScreen.tsx → checkoutService
src/screens/ExchangeRatesScreen.tsx → financeService
src/screens/FinanceOverviewScreen.tsx → financeService
src/screens/ProjectFinanceAnalyticsScreen.tsx → financeService
src/screens/PurchaseOrdersScreen.tsx → financeService
```

### **Other (10 files)**
```
src/components/layout/Navbar.tsx → authService
src/contexts/AuthContext.tsx → authService
... (and 7 more)
```

---

## **🚀 MIGRATION COMMANDS**

### **Quick Migrate (One-Liner)**

For each file, run:
```bash
# Replace apiService import
sed -i 's/import apiService/import <specificService>/g' <file>

# Replace all apiService. calls
sed -i 's/apiService\./<specificService>./g' <file>
```

### **Batch Migration by Domain**

**Auth-related files:**
```bash
cd "C:\Users\User\Documents\MycaeTracker"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "apiService.*login\|apiService.*register\|apiService.*logout" | \
  xargs -I {} sed -i 's/import apiService/import authService/g' {} && \
  xargs -I {} sed -i 's/apiService\./authService./g' {}
```

**Finance-related files:**
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "apiService.*Invoice\|apiService.*PO\|apiService.*ExchangeRate" | \
  xargs -I {} sed -i 's/import apiService/import financeService/g' {} && \
  xargs -I {} sed -i 's/apiService\./financeService./g' {}
```

**Inventory-related files:**
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "apiService.*Inventory" | \
  xargs -I {} sed -i 's/import apiService/import inventoryService/g' {} && \
  xargs -I {} sed -i 's/apiService\./inventoryService./g' {}
```

**Team-related files:**
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "apiService.*Team\|apiService.*Member" | \
  xargs -I {} sed -i 's/import apiService/import teamService/g' {} && \
  xargs -I {} sed -i 's/apiService\./teamService./g' {}
```

---

## **📋 TESTING CHECKLIST**

After migration, verify:
- [ ] Dev server starts without errors
- [ ] Can login/logout
- [ ] Can create/view inventory items
- [ ] Can create/view finance documents
- [ ] No `apiService is not defined` errors in console
- [ ] All API calls work as expected

---

## **🎯 END GOAL**

Once all migrations complete:
1. Delete `src/services/api.service.ts` OR keep as tiny facade
2. Update all imports to use domain services
3. Remove god object from codebase
4. Achieve better separation of concerns

---

## **📊 PROGRESS TRACKING**

- **Total Files:** 31
- **Completed:** 2 (6.5%)
- **Remaining:** 29 (93.5%)
- **Estimated Time:** 2-3 hours for full migration

---

## **💡 ARCHITECTURAL IMPROVEMENT**

**Before (God Object):**
```
Component → apiService.login()
           → apiService.getInventory()
           → apiService.createInvoice()
           → 114+ more methods...
```

**After (Domain Services):**
```
Component → authService.login()
         → inventoryService.getInventory()
         → financeService.createInvoice()
```

**Benefits:**
✅ Better code organization  
✅ Easier to test  
✅ Fewer merge conflicts  
✅ Clearer dependencies  
✅ Single responsibility per service  
