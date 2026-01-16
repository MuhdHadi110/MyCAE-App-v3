const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

async function deleteInvalidProject() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connected to database');

    const [result] = await connection.execute(
      'DELETE FROM projects WHERE project_code = ?',
      ['J2626006']
    );

    console.log(`✅ Deleted ${result.affectedRows} row(s)`);

    if (result.affectedRows > 0) {
      const [projects] = await connection.execute(
        'SELECT id, project_code, title FROM projects WHERE project_code = ?',
        ['J2626006']
      );

      if (projects.length > 0) {
        console.log('');
        console.log('Project still exists:', projects[0]);
        console.log('Please run this command again or use phpMyAdmin to delete manually.');
      }
    } else {
      console.log('✅ Project J2626006 successfully deleted');
      console.log('');
      console.log('Refresh your frontend page to see the updated suggested project code.');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('If database connection failed, please check:');
    console.log('1. Backend server is running?');
    console.log('2. Database credentials in .env.local are correct');
    console.log('');
    console.log('Alternative: Delete manually in phpMyAdmin:');
    console.log('DELETE FROM projects WHERE project_code = "J2626006";');
  }
}

deleteInvalidProject();
