<?php
/**
 * Interactive Database Setup Script
 * Run this to configure your database connection
 */

echo "=== Chit Fund Admin Portal - Database Setup ===\n\n";

// Get database configuration
echo "Enter MySQL configuration:\n";
echo "Host [localhost]: ";
$host = trim(fgets(STDIN)) ?: 'localhost';

echo "Username [root]: ";
$username = trim(fgets(STDIN)) ?: 'root';

echo "Password []: ";
$password = trim(fgets(STDIN)) ?: '';

echo "Database name [chitfund_db]: ";
$db_name = trim(fgets(STDIN)) ?: 'chitfund_db';

echo "\nTesting connection...\n";

// Test connection
try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✓ Connected to MySQL server successfully!\n";
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS $db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database '$db_name' created/verified!\n";
    
    // Test database connection
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    echo "✓ Connected to database successfully!\n\n";
    
    // Update database.php
    $db_file = __DIR__ . '/config/database.php';
    $content = file_get_contents($db_file);
    
    $content = preg_replace(
        '/private \$host = "[^"]*";/',
        "private \$host = \"$host\";",
        $content
    );
    $content = preg_replace(
        '/private \$db_name = "[^"]*";/',
        "private \$db_name = \"$db_name\";",
        $content
    );
    $content = preg_replace(
        '/private \$username = "[^"]*";/',
        "private \$username = \"$username\";",
        $content
    );
    $content = preg_replace(
        '/private \$password = "[^"]*";/',
        "private \$password = \"$password\";",
        $content
    );
    
    file_put_contents($db_file, $content);
    echo "✓ Updated database.php configuration!\n\n";
    
    // Update init_database.php
    $init_file = __DIR__ . '/config/init_database.php';
    $init_content = file_get_contents($init_file);
    
    $init_content = preg_replace(
        "/'host' => '[^']*',/",
        "'host' => '$host',",
        $init_content
    );
    $init_content = preg_replace(
        "/'username' => '[^']*',/",
        "'username' => '$username',",
        $init_content
    );
    $init_content = preg_replace(
        "/'password' => '[^']*',/",
        "'password' => '$password',",
        $init_content
    );
    $init_content = preg_replace(
        "/'db_name' => '[^']*',/",
        "'db_name' => '$db_name',",
        $init_content
    );
    
    file_put_contents($init_file, $init_content);
    echo "✓ Updated init_database.php configuration!\n\n";
    
    echo "Configuration saved! Now run:\n";
    echo "  php config/init_database.php\n\n";
    
} catch(PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "\nPlease check:\n";
    echo "1. MySQL server is running\n";
    echo "2. Username and password are correct\n";
    echo "3. User has CREATE DATABASE privileges\n";
    exit(1);
}

