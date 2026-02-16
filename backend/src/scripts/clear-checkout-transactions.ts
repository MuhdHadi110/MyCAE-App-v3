import { AppDataSource } from '../config/database';

async function clearCheckoutTransactions() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    
    console.log('Clearing all checkout transactions...');
    await AppDataSource.query('DELETE FROM checkouts');
    
    console.log('✅ All checkout transactions cleared successfully!');
    console.log('All equipment has been returned to inventory.');
  } catch (error) {
    console.error('❌ Error clearing transactions:', error);
  } finally {
    await AppDataSource.destroy();
    process.exit(0);
  }
}

clearCheckoutTransactions();
