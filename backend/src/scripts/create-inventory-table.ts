import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function createInventoryTable() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    console.log('Creating inventory table...');
    
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        barcode VARCHAR(255) NULL,
        category VARCHAR(100) NOT NULL,
        quantity INT DEFAULT 0,
        minimum_stock INT DEFAULT 0,
        location VARCHAR(255) NOT NULL,
        unit_of_measure VARCHAR(50) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        supplier VARCHAR(255) NULL,
        status ENUM('available', 'low-stock', 'out-of-stock', 'in-maintenance', 'discontinued') DEFAULT 'available',
        notes TEXT NULL,
        image_url VARCHAR(500) NULL,
        next_maintenance_date DATE NULL,
        last_calibrated_date DATE NULL,
        in_maintenance_quantity INT DEFAULT 0,
        last_action ENUM('added', 'returned', 'checked-out', 'updated') DEFAULT 'added',
        last_action_date TIMESTAMP NULL,
        last_action_by VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (sku),
        INDEX idx_barcode (barcode),
        INDEX idx_category (category),
        INDEX idx_status (status)
      )
    `);
    
    console.log('✅ inventory table created successfully');

    await AppDataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createInventoryTable();
