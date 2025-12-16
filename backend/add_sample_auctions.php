<?php
/**
 * Add Sample Auction Data
 * Run this script to add sample auction data to your database
 */

require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Failed to connect to database\n");
}

echo "Adding sample auction data...\n\n";

try {
    // Get scheme IDs
    $schemeStmt = $conn->query("SELECT id, name FROM chit_schemes ORDER BY id LIMIT 3");
    $schemes = $schemeStmt->fetchAll();
    
    if (count($schemes) == 0) {
        die("ERROR: No chit schemes found. Please create schemes first.\n");
    }
    
    // Get customer IDs
    $customerStmt = $conn->query("SELECT id, name FROM customers ORDER BY id LIMIT 3");
    $customers = $customerStmt->fetchAll();
    
    if (count($customers) == 0) {
        die("ERROR: No customers found. Please create customers first.\n");
    }
    
    $scheme1Id = $schemes[0]['id'];
    $scheme1Name = $schemes[0]['name'];
    $scheme2Id = count($schemes) > 1 ? $schemes[1]['id'] : $schemes[0]['id'];
    $scheme2Name = count($schemes) > 1 ? $schemes[1]['name'] : $schemes[0]['name'];
    
    $customer1Id = $customers[0]['id'];
    $customer1Name = $customers[0]['name'];
    $customer2Id = count($customers) > 1 ? $customers[1]['id'] : $customers[0]['id'];
    $customer2Name = count($customers) > 1 ? $customers[1]['name'] : $customers[0]['name'];
    
    // Check if auctions already exist
    $checkStmt = $conn->query("SELECT COUNT(*) FROM auctions");
    $existingCount = $checkStmt->fetchColumn();
    
    if ($existingCount > 0) {
        echo "WARNING: Auctions already exist in database ($existingCount records).\n";
        echo "Do you want to add more sample auctions? (y/n): ";
        $handle = fopen("php://stdin", "r");
        $line = trim(fgets($handle));
        fclose($handle);
        if (strtolower($line) !== 'y') {
            echo "Cancelled.\n";
            exit;
        }
    }
    
    // Insert sample auctions
    $stmt = $conn->prepare("INSERT INTO auctions (scheme_id, auction_date, base_amount, highest_bid, winner_id, status) VALUES (?, ?, ?, ?, ?, ?)");
    
    // Auction 1: Completed auction for scheme 1
    $stmt->execute([
        $scheme1Id,
        '2024-02-15',
        100000,
        95000,  // Winner bid 95,000 (got 5,000 discount)
        $customer1Id,
        'completed'
    ]);
    echo "✓ Added completed auction for: $scheme1Name\n";
    echo "  - Date: 2024-02-15\n";
    echo "  - Base Amount: ₹1,00,000\n";
    echo "  - Winning Bid: ₹95,000 (Discount: ₹5,000)\n";
    echo "  - Winner: $customer1Name\n\n";
    
    // Auction 2: Scheduled auction for scheme 1
    $stmt->execute([
        $scheme1Id,
        '2024-03-15',
        100000,
        0,  // No bids yet
        NULL,
        'scheduled'
    ]);
    echo "✓ Added scheduled auction for: $scheme1Name\n";
    echo "  - Date: 2024-03-15\n";
    echo "  - Base Amount: ₹1,00,000\n";
    echo "  - Status: Scheduled (awaiting bids)\n\n";
    
    // Auction 3: Completed auction for scheme 2
    if (count($schemes) > 1) {
        $stmt->execute([
            $scheme2Id,
            '2024-02-20',
            500000,
            480000,  // Winner bid 4,80,000 (got 20,000 discount)
            $customer2Id,
            'completed'
        ]);
        echo "✓ Added completed auction for: $scheme2Name\n";
        echo "  - Date: 2024-02-20\n";
        echo "  - Base Amount: ₹5,00,000\n";
        echo "  - Winning Bid: ₹4,80,000 (Discount: ₹20,000)\n";
        echo "  - Winner: $customer2Name\n\n";
    }
    
    echo "Sample auction data added successfully!\n";
    echo "\nYou can now view auctions in:\n";
    echo "1. MySQL Workbench: SELECT * FROM auctions;\n";
    echo "2. Frontend: http://localhost:3000/auctions\n";
    
} catch(PDOException $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}

