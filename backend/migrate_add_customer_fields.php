<?php
/**
 * Database Migration Script
 * Adds city and whatsapp_number columns to customers table
 * 
 * Run this script to update your existing database:
 * php migrate_add_customer_fields.php
 */

require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Failed to connect to database\n");
}

echo "=== Adding City and WhatsApp Number Fields ===\n\n";

try {
    // Check if city column exists
    $checkCity = $conn->query("SHOW COLUMNS FROM customers LIKE 'city'");
    if ($checkCity->rowCount() == 0) {
        $conn->exec("ALTER TABLE customers ADD COLUMN city VARCHAR(100) AFTER address");
        echo "✓ Added 'city' column\n";
    } else {
        echo "⚠ Column 'city' already exists\n";
    }
    
    // Check if whatsapp_number column exists
    $checkWhatsApp = $conn->query("SHOW COLUMNS FROM customers LIKE 'whatsapp_number'");
    if ($checkWhatsApp->rowCount() == 0) {
        $conn->exec("ALTER TABLE customers ADD COLUMN whatsapp_number VARCHAR(20) AFTER phone");
        echo "✓ Added 'whatsapp_number' column\n";
    } else {
        echo "⚠ Column 'whatsapp_number' already exists\n";
    }
    
    echo "\n✓ Migration completed successfully!\n";
    echo "\nYou can now use city and WhatsApp number fields in the customer forms.\n";
    
} catch(PDOException $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}

