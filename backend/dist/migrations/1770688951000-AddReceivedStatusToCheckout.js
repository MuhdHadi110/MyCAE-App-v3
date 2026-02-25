"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReceivedStatusToCheckout1770688951000 = void 0;
class AddReceivedStatusToCheckout1770688951000 {
    async up(queryRunner) {
        // Add 'received' to the checkout status enum
        await queryRunner.query(`
      ALTER TABLE checkouts 
      MODIFY COLUMN status ENUM('checked-out', 'returned', 'overdue', 'partial-return', 'received') 
      NOT NULL DEFAULT 'checked-out'
    `);
        // Update existing "Item received" records from RETURNED to RECEIVED
        await queryRunner.query(`
      UPDATE checkouts 
      SET status = 'received' 
      WHERE purpose LIKE 'Item received:%' 
      AND status = 'returned'
    `);
        console.log('Migration completed: Added RECEIVED status and updated existing records');
    }
    async down(queryRunner) {
        // Revert RECEIVED records back to RETURNED
        await queryRunner.query(`
      UPDATE checkouts 
      SET status = 'returned' 
      WHERE status = 'received'
    `);
        // Remove 'received' from enum
        await queryRunner.query(`
      ALTER TABLE checkouts 
      MODIFY COLUMN status ENUM('checked-out', 'returned', 'overdue', 'partial-return') 
      NOT NULL DEFAULT 'checked-out'
    `);
    }
}
exports.AddReceivedStatusToCheckout1770688951000 = AddReceivedStatusToCheckout1770688951000;
//# sourceMappingURL=1770688951000-AddReceivedStatusToCheckout.js.map