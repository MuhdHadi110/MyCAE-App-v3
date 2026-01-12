/**
 * Production Environment Verification Script
 * Run this on the server after deployment to verify configuration
 *
 * Usage: node verify-production.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 MycaeTracker Production Verification\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// Check 1: .env file exists
console.log('1. Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  checks.passed.push('.env file exists');
  console.log('✅ .env file found');

  // Read and validate .env contents
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

  const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'NODE_ENV', 'JWT_SECRET'];
  const missingVars = [];

  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    checks.failed.push(`Missing environment variables: ${missingVars.join(', ')}`);
    console.log(`❌ Missing variables: ${missingVars.join(', ')}`);
  } else {
    checks.passed.push('All required environment variables present');
    console.log('✅ All required variables present');
  }

  // Check JWT_SECRET strength
  const jwtSecretMatch = envContent.match(/JWT_SECRET=(.+)/);
  if (jwtSecretMatch) {
    const jwtSecret = jwtSecretMatch[1].trim();
    if (jwtSecret.length < 32) {
      checks.warnings.push('JWT_SECRET is too short (should be 32+ characters)');
      console.log('⚠️  JWT_SECRET is too short');
    } else if (jwtSecret.includes('change-this') || jwtSecret.includes('example')) {
      checks.warnings.push('JWT_SECRET appears to be a placeholder');
      console.log('⚠️  JWT_SECRET appears to be a placeholder');
    } else {
      checks.passed.push('JWT_SECRET appears secure');
      console.log('✅ JWT_SECRET appears secure');
    }
  }

} else {
  checks.failed.push('.env file not found');
  console.log('❌ .env file not found');
}

// Check 2: dist folder exists
console.log('\n2. Checking compiled files...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  checks.passed.push('dist/ folder exists');
  console.log('✅ dist/ folder found');

  // Check for server.js
  const serverPath = path.join(distPath, 'server.js');
  if (fs.existsSync(serverPath)) {
    checks.passed.push('dist/server.js exists');
    console.log('✅ dist/server.js found');
  } else {
    checks.failed.push('dist/server.js not found');
    console.log('❌ dist/server.js not found - run npm run build');
  }
} else {
  checks.failed.push('dist/ folder not found');
  console.log('❌ dist/ folder not found - run npm run build');
}

// Check 3: node_modules exists
console.log('\n3. Checking dependencies...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  checks.passed.push('node_modules/ folder exists');
  console.log('✅ node_modules/ found');

  // Check critical dependencies
  const criticalDeps = ['express', 'typeorm', 'mysql2'];
  const missingDeps = [];

  criticalDeps.forEach(dep => {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    checks.failed.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    console.log(`❌ Missing: ${missingDeps.join(', ')}`);
  } else {
    checks.passed.push('Critical dependencies installed');
    console.log('✅ Critical dependencies present');
  }
} else {
  checks.failed.push('node_modules/ not found');
  console.log('❌ node_modules/ not found - run npm install');
}

// Check 4: package.json exists
console.log('\n4. Checking package files...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  checks.passed.push('package.json exists');
  console.log('✅ package.json found');

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (pkg.scripts && pkg.scripts.start) {
      checks.passed.push('start script defined');
      console.log('✅ Start script defined');
    } else {
      checks.warnings.push('No start script in package.json');
      console.log('⚠️  No start script defined');
    }
  } catch (err) {
    checks.warnings.push('Could not parse package.json');
    console.log('⚠️  Could not parse package.json');
  }
} else {
  checks.failed.push('package.json not found');
  console.log('❌ package.json not found');
}

// Check 5: File permissions (Unix/Linux only)
if (process.platform !== 'win32') {
  console.log('\n5. Checking file permissions...');
  try {
    const stats = fs.statSync(__dirname);
    const mode = (stats.mode & parseInt('777', 8)).toString(8);
    console.log(`   Directory permissions: ${mode}`);

    if (mode === '755' || mode === '750') {
      checks.passed.push('Directory permissions OK');
      console.log('✅ Directory permissions OK');
    } else {
      checks.warnings.push(`Directory permissions are ${mode} (recommended: 755)`);
      console.log(`⚠️  Directory permissions: ${mode} (recommended: 755)`);
    }
  } catch (err) {
    checks.warnings.push('Could not check permissions');
    console.log('⚠️  Could not check permissions');
  }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(50));

console.log(`\n✅ Passed: ${checks.passed.length}`);
checks.passed.forEach(item => console.log(`   • ${item}`));

if (checks.warnings.length > 0) {
  console.log(`\n⚠️  Warnings: ${checks.warnings.length}`);
  checks.warnings.forEach(item => console.log(`   • ${item}`));
}

if (checks.failed.length > 0) {
  console.log(`\n❌ Failed: ${checks.failed.length}`);
  checks.failed.forEach(item => console.log(`   • ${item}`));
}

console.log('\n' + '='.repeat(50));

if (checks.failed.length === 0) {
  if (checks.warnings.length === 0) {
    console.log('✅ All checks passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('⚠️  No critical errors, but please review warnings.');
    process.exit(0);
  }
} else {
  console.log('❌ Please fix the failed checks before deploying.');
  process.exit(1);
}
