<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Could not connect to the database to run migration.\n");
}

echo "Starting migration to allow multiple memberships...\n";

try {
    // Check if unique constraint exists
    $stmt = $conn->query("SHOW INDEX FROM customer_schemes WHERE Key_name = 'unique_customer_scheme'");
    if ($stmt->rowCount() > 0) {
        // Drop the unique constraint
        $conn->exec("ALTER TABLE customer_schemes DROP INDEX unique_customer_scheme");
        echo "✓ Removed unique constraint on (customer_id, scheme_id).\n";
    } else {
        echo "- Unique constraint does not exist. Skipping.\n";
    }

    echo "\nMigration complete. Customers can now join the same scheme multiple times.\n";
} catch(PDOException $e) {
    die("ERROR during migration: " . $e->getMessage() . "\n");
}
?>

