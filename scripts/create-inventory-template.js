import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new workbook
const wb = XLSX.utils.book_new();

// Define the headers and sample data
const headers = [
  'title',
  'sku', 
  'barcode',
  'category',
  'quantity',
  'unitOfMeasure',
  'minimumStock',
  'location',
  'supplier',
  'status',
  'notes',
  'lastCalibratedDate'
];

const sampleData = [
  [
    'Chasis 9171',
    'CHAS-9171',
    '2114DF2',
    'Chassis',
    14,
    'units',
    2,
    'Office',
    'Kabex',
    '',
    'Used for engine testing',
    '15/03/2024'
  ],
  [
    'Wilcoxon 731-20G',
    'WILC-731-20G',
    '1FADE7E',
    'Vibration Sensor',
    1,
    'pcs',
    1,
    'Office',
    'Mutiara Jaya Teknik',
    '',
    'Recently calibrated',
    '20/03/2024'
  ],
  [
    'IT Equipment Laptop',
    'LAP-001',
    '',
    'IT Equipment',
    10,
    'units',
    2,
    'Office',
    'Dell Malaysia',
    '',
    'Standard office laptop',
    ''
  ],
  [
    'Office Supplies Paper',
    'PAP-001',
    '',
    'Office Supplies',
    100,
    'box',
    20,
    'Storage Room',
    'Staples',
    '',
    'A4 paper 500 sheets per box',
    ''
  ]
];

// Create Instructions Sheet
const instructionsData = [
  ['INVENTORY BULK UPLOAD TEMPLATE - INSTRUCTIONS'],
  [''],
  ['REQUIRED FIELDS (Must be filled):'],
  ['• title', 'Item name/description'],
  ['• sku', 'Unique stock keeping unit code'],
  ['• category', 'Must match existing categories'],
  ['• quantity', 'Current stock quantity (number)'],
  ['• minimumStock', 'Minimum stock level for alerts (number)'],
  ['• location', 'Storage location (e.g., Office, Warehouse)'],
  [''],
  ['OPTIONAL FIELDS:'],
  ['• barcode', 'Product barcode/serial number'],
  ['• unitOfMeasure', 'Unit type (e.g., units, pcs, box). Defaults to "units"'],
  ['• supplier', 'Supplier/vendor name'],
  ['• status', 'AUTO-CALCULATED from quantity vs minimumStock (value ignored)'],
  ['• notes', 'Additional notes or description'],
  ['• lastCalibratedDate', 'Last calibration date (DD/MM/YYYY format)'],
  [''],
  ['IMPORTANT NOTES:'],
  ['• Categories must match existing system categories exactly'],
  ['• Date format: DD/MM/YYYY (e.g., 15/03/2024)'],
  ['• Quantity and minimumStock must be numbers'],
  ['• Status is automatically calculated - leave blank or any value will be ignored'],
  ['• Do not modify the column headers in row 1'],
  [''],
  ['VALID CATEGORIES:'],
  ['Chassis'],
  ['Consumables'],
  ['Data Acquisition Module'],
  ['Dytran Impact Hammer'],
  ['Electronics'],
  ['Furniture'],
  ['Impulse Force Hammer'],
  ['IT Equipment'],
  ['Laptop'],
  ['Microphone'],
  ['Office Supplies'],
  ['Safety Equipment'],
  ['Sound Level Meter'],
  ['Tools & Equipment'],
  ['Triaxial Vibration Sensor'],
  ['Vibration Sensor'],
  ['Other']
];

const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);

// Style the instructions sheet
wsInstructions['!cols'] = [{wch: 50}, {wch: 60}];

// Create Data Sheet with headers and sample data
const dataWithHeaders = [headers, ...sampleData];
const wsData = XLSX.utils.aoa_to_sheet(dataWithHeaders);

// Set column widths for better visibility
wsData['!cols'] = [
  {wch: 25}, // title
  {wch: 18}, // sku
  {wch: 15}, // barcode
  {wch: 25}, // category
  {wch: 10}, // quantity
  {wch: 15}, // unitOfMeasure
  {wch: 15}, // minimumStock
  {wch: 20}, // location
  {wch: 25}, // supplier
  {wch: 12}, // status
  {wch: 35}, // notes
  {wch: 20}  // lastCalibratedDate
];

// Add sheets to workbook
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
XLSX.utils.book_append_sheet(wb, wsData, 'Inventory Data');

// Ensure directories exist
const distDir = path.join(__dirname, '..', 'dist', 'templates');
const publicDir = path.join(__dirname, '..', 'public', 'templates');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the Excel file to both locations
const distPath = path.join(distDir, 'inventory-bulk-upload-template.xlsx');
const publicPath = path.join(publicDir, 'inventory-bulk-upload-template.xlsx');

XLSX.writeFile(wb, distPath);
XLSX.writeFile(wb, publicPath);

console.log('✅ Excel template created successfully!');
console.log(`📁 Saved to: ${distPath}`);
console.log(`📁 Saved to: ${publicPath}`);
console.log('\n📋 Template includes:');
console.log('   • Instructions sheet with field descriptions');
console.log('   • Formatted data sheet with sample entries');
console.log('   • Proper column widths for readability');
console.log('   • List of valid categories');
console.log('\n🎨 Open in Excel to see the improved formatting!');
