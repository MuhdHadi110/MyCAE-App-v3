export type CheckoutStatus = 'active' | 'partial-return' | 'fully-returned' | 'overdue';

export type ItemReturnStatus = 'checked-out' | 'returned';

export interface CheckoutItemDetail {
  id: string;
  itemId: string;
  itemName: string;
  barcode: string;
  quantity: number;
  returnedQuantity: number;
  remainingQuantity: number;
  returnStatus: ItemReturnStatus;
  returnDate?: string;
}

export interface ExtendedCheckout {
  id: string;
  masterBarcode: string;
  checkedOutBy: string;
  checkedOutByEmail: string;
  checkedOutDate: string;
  expectedReturnDate?: string;
  purpose?: string;
  notes?: string;
  status: CheckoutStatus;
  items: CheckoutItemDetail[];
  totalItems: number;
  returnedItems: number;
  remainingItems: number;
  returnHistory: ReturnHistoryEntry[];
}

export interface ReturnHistoryEntry {
  id: string;
  returnDate: string;
  returnedBy: string;
  returnType: 'full' | 'partial' | 'individual';
  itemsReturned: number;
  notes?: string;
  items: Array<{
    itemName: string;
    quantity: number;
  }>;
}

export interface PartialReturnInput {
  masterBarcode: string;
  returnedBy: string;
  returnDate: string;
  notes?: string;
  items: Array<{
    itemId: string;
    quantityToReturn: number;
  }>;
}

export interface CheckoutFilters {
  status?: CheckoutStatus | 'all';
  search?: string;
  userId?: string;
  showMyCheckoutsFirst?: boolean;
}

export interface CheckoutStats {
  totalActive: number;
  myActive: number;
  overdue: number;
  partialReturns: number;
}
