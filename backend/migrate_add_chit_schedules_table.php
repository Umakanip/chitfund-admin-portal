<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Could not connect to the database to run migration.\n");
}

echo "Starting chit_schedules table migration...\n";

try {
    // Check if chit_schedules table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'chit_schedules'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("CREATE TABLE chit_schedules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            scheme_id INT NOT NULL,
            month_number INT NOT NULL,
            customer_id INT NULL,
            allocation_type ENUM('auction', 'fixed', 'pending') DEFAULT 'pending',
            allocation_date DATE NULL,
            status ENUM('pending', 'allocated', 'completed', 'cancelled') DEFAULT 'pending',
            amount_received DECIMAL(15, 2) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
            UNIQUE KEY unique_scheme_month (scheme_id, month_number)
        )");
        echo "✓ Created 'chit_schedules' table.\n";
    } else {
        echo "- 'chit_schedules' table already exists. Skipping.\n";
    }

    echo "\nChit schedules table migration complete.\n";
} catch(PDOException $e) {
    die("ERROR during migration: " . $e->getMessage() . "\n");
}
?>

