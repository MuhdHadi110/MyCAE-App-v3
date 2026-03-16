<?php
/**
 * MyCAE Tracker - Create Test Admin User
 * Run this via browser: https://app.mycae.co/create-admin.php
 * Then DELETE this file after use for security!
 */

// Database configuration - UPDATE THESE!
$db_host = 'localhost';
$db_name = 'mycaec78_mycaeapp';
$db_user = 'mycaec78_admin';
$db_pass = 'YOUR_DB_PASSWORD_HERE';

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>MyCAE Tracker - Admin User Creation</h2>";
    
    // Check users table structure
    $stmt = $pdo->query("SHOW COLUMNS FROM users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p><strong>Users table columns:</strong> " . implode(', ', $columns) . "</p>";
    
    // Generate UUID
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    
    // Admin credentials
    $name = 'Administrator';
    $email = 'admin@app.mycae.co';
    $password_hash = '$2b$12$96lr3fV6IBBeZfSdLh6F1O6S29nYw1KeF21.IE5KUgEVDfm3RSBJi'; // Password: Admin123!
    $roles = '["admin"]';
    $is_active = 1;
    $is_temp_password = 1;
    
    // Check if user already exists
    $check = $pdo->prepare("SELECT id, email FROM users WHERE email = ?");
    $check->execute([$email]);
    $existing = $check->fetch();
    
    if ($existing) {
        echo "<p style='color: orange;'>⚠️ User already exists with email: $email</p>";
        echo "<p>Updating password...</p>";
        
        // Determine password column name
        $password_column = in_array('password_hash', $columns) ? 'password_hash' : 'password';
        
        $update = $pdo->prepare("UPDATE users SET $password_column = ?, is_temp_password = 1, temp_password_expires = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE email = ?");
        $update->execute([$password_hash, $email]);
        
        echo "<p style='color: green;'>✅ Password updated successfully!</p>";
    } else {
        // Determine column names
        $password_column = in_array('password_hash', $columns) ? 'password_hash' : 'password';
        $has_temp_pass = in_array('is_temp_password', $columns);
        $has_temp_expires = in_array('temp_password_expires', $columns);
        
        // Build query dynamically based on available columns
        $fields = ['id', 'name', 'email', $password_column, 'roles', 'is_active', 'created_at'];
        $placeholders = ['?', '?', '?', '?', '?', '?', 'NOW()'];
        $values = [$uuid, $name, $email, $password_hash, $roles, $is_active];
        
        if ($has_temp_pass) {
            $fields[] = 'is_temp_password';
            $placeholders[] = '?';
            $values[] = $is_temp_password;
        }
        
        if ($has_temp_expires) {
            $fields[] = 'temp_password_expires';
            $placeholders[] = 'DATE_ADD(NOW(), INTERVAL 7 DAY)';
        }
        
        $sql = "INSERT INTO users (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($values);
        
        echo "<p style='color: green;'>✅ Admin user created successfully!</p>";
    }
    
    echo "<hr>";
    echo "<h3>Login Credentials:</h3>";
    echo "<p><strong>Email:</strong> admin@app.mycae.co</p>";
    echo "<p><strong>Password:</strong> Admin123!</p>";
    echo "<p><em>You will be prompted to change password on first login.</em></p>";
    
    echo "<hr>";
    echo "<p style='color: red;'><strong>⚠️ SECURITY WARNING:</strong></p>";
    echo "<p>DELETE this file (create-admin.php) immediately after use!</p>";
    echo "<p>File location: " . __FILE__ . "</p>";
    
} catch (PDOException $e) {
    echo "<h2 style='color: red;'>Error</h2>";
    echo "<p>Database connection failed: " . $e->getMessage() . "</p>";
    echo "<p>Please check your database credentials in this file.</p>";
}
?>
