<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Could not connect to the database to run migration.\n");
}

echo "Starting customer_schemes table migration...\n";

try {
    // Check if customer_schemes table exists
    $stmt = $conn->query("SHOW TABLES LIKE 'customer_schemes'");
    if ($stmt->rowCount() == 0) {
        $conn->exec("CREATE TABLE customer_schemes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            scheme_id INT NOT NULL,
            joined_date DATE DEFAULT (CURRENT_DATE),
            status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE,
            UNIQUE KEY unique_customer_scheme (customer_id, scheme_id)
        )");
        echo "✓ Created 'customer_schemes' junction table.\n";
    } else {
        echo "- 'customer_schemes' table already exists. Skipping.\n";
    }

    echo "\nCustomer schemes table migration complete.\n";
} catch(PDOException $e) {
    die("ERROR during migration: " . $e->getMessage() . "\n");
}
?>

