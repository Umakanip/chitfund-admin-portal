<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Could not connect to the database to run migration.\n");
}

echo "Starting chit_schemes table migration...\n";

try {
    // Check if chit_frequency column exists
    $stmt = $conn->query("SHOW COLUMNS FROM chit_schemes LIKE 'chit_frequency'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE chit_schemes ADD COLUMN chit_frequency ENUM('week', 'month') DEFAULT 'month' AFTER end_date");
        echo "✓ Added 'chit_frequency' column to 'chit_schemes' table.\n";
    } else {
        echo "- 'chit_frequency' column already exists in 'chit_schemes' table. Skipping.\n";
    }

    // Check if chit_type column exists
    $stmt = $conn->query("SHOW COLUMNS FROM chit_schemes LIKE 'chit_type'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("ALTER TABLE chit_schemes ADD COLUMN chit_type ENUM('fixed', 'auction') DEFAULT 'auction' AFTER chit_frequency");
        echo "✓ Added 'chit_type' column to 'chit_schemes' table.\n";
    } else {
        echo "- 'chit_type' column already exists in 'chit_schemes' table. Skipping.\n";
    }

    echo "\nChit schemes table migration complete.\n";
} catch(PDOException $e) {
    die("ERROR during migration: " . $e->getMessage() . "\n");
}
?>

