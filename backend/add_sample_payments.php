<?php
/**
 * Add Sample Payment Data
 * Run this script to add sample payment data to your database
 */

require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Failed to connect to database\n");
}

echo "Adding sample payment data...\n\n";

try {
    // Get scheme IDs and their monthly installments
    $schemeStmt = $conn->query("SELECT id, name, monthly_installment FROM chit_schemes ORDER BY id LIMIT 3");
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
    $scheme1Installment = (float)$schemes[0]['monthly_installment'];
    
    $scheme2Id = count($schemes) > 1 ? $schemes[1]['id'] : $schemes[0]['id'];
    $scheme2Name = count($schemes) > 1 ? $schemes[1]['name'] : $schemes[0]['name'];
    $scheme2Installment = count($schemes) > 1 ? (float)$schemes[1]['monthly_installment'] : (float)$schemes[0]['monthly_installment'];
    
    $customer1Id = $customers[0]['id'];
    $customer1Name = $customers[0]['name'];
    $customer2Id = count($customers) > 1 ? $customers[1]['id'] : $customers[0]['id'];
    $customer2Name = count($customers) > 1 ? $customers[1]['name'] : $customers[0]['name'];
    $customer3Id = count($customers) > 2 ? $customers[2]['id'] : $customers[0]['id'];
    $customer3Name = count($customers) > 2 ? $customers[2]['name'] : $customers[0]['name'];
    
    // Check if payments already exist
    $checkStmt = $conn->query("SELECT COUNT(*) FROM payments");
    $existingCount = $checkStmt->fetchColumn();
    
    if ($existingCount > 0) {
        echo "WARNING: Payments already exist in database ($existingCount records).\n";
        echo "Do you want to add more sample payments? (y/n): ";
        $handle = fopen("php://stdin", "r");
        $line = trim(fgets($handle));
        fclose($handle);
        if (strtolower($line) !== 'y') {
            echo "Cancelled.\n";
            exit;
        }
    }
    
    // Insert sample payments
    $stmt = $conn->prepare("INSERT INTO payments (customer_id, scheme_id, amount, payment_date, month, status) VALUES (?, ?, ?, ?, ?, ?)");
    
    // Payment 1: Paid payment for customer 1, scheme 1, month 1
    $stmt->execute([
        $customer1Id,
        $scheme1Id,
        $scheme1Installment,
        '2024-01-05',
        1,
        'paid'
    ]);
    echo "✓ Added paid payment: $customer1Name → $scheme1Name (Month 1, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 2: Paid payment for customer 2, scheme 1, month 1
    $stmt->execute([
        $customer2Id,
        $scheme1Id,
        $scheme1Installment,
        '2024-01-06',
        1,
        'paid'
    ]);
    echo "✓ Added paid payment: $customer2Name → $scheme1Name (Month 1, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 3: Paid payment for customer 1, scheme 1, month 2
    $stmt->execute([
        $customer1Id,
        $scheme1Id,
        $scheme1Installment,
        '2024-02-05',
        2,
        'paid'
    ]);
    echo "✓ Added paid payment: $customer1Name → $scheme1Name (Month 2, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 4: Paid payment for customer 2, scheme 1, month 2
    $stmt->execute([
        $customer2Id,
        $scheme1Id,
        $scheme1Installment,
        '2024-02-07',
        2,
        'paid'
    ]);
    echo "✓ Added paid payment: $customer2Name → $scheme1Name (Month 2, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 5: Pending payment for customer 3, scheme 1, month 2
    $stmt->execute([
        $customer3Id,
        $scheme1Id,
        $scheme1Installment,
        NULL,
        2,
        'pending'
    ]);
    echo "✓ Added pending payment: $customer3Name → $scheme1Name (Month 2, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 6: Pending payment for customer 1, scheme 1, month 3
    $stmt->execute([
        $customer1Id,
        $scheme1Id,
        $scheme1Installment,
        NULL,
        3,
        'pending'
    ]);
    echo "✓ Added pending payment: $customer1Name → $scheme1Name (Month 3, ₹" . number_format($scheme1Installment, 2) . ")\n";
    
    // Payment 7: Paid payment for customer 2, scheme 2, month 1
    if (count($schemes) > 1) {
        $stmt->execute([
            $customer2Id,
            $scheme2Id,
            $scheme2Installment,
            '2024-01-10',
            1,
            'paid'
        ]);
        echo "✓ Added paid payment: $customer2Name → $scheme2Name (Month 1, ₹" . number_format($scheme2Installment, 2) . ")\n";
        
        // Payment 8: Overdue payment for customer 3, scheme 2, month 1
        $stmt->execute([
            $customer3Id,
            $scheme2Id,
            $scheme2Installment,
            NULL,
            1,
            'overdue'
        ]);
        echo "✓ Added overdue payment: $customer3Name → $scheme2Name (Month 1, ₹" . number_format($scheme2Installment, 2) . ")\n";
    }
    
    echo "\nSample payment data added successfully!\n";
    echo "\nPayment Summary:\n";
    $summaryStmt = $conn->query("SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total
    FROM payments
    GROUP BY status");
    $summary = $summaryStmt->fetchAll();
    foreach ($summary as $row) {
        echo "  - {$row['status']}: {$row['count']} payments (Total: ₹" . number_format($row['total'], 2) . ")\n";
    }
    
    echo "\nYou can now view payments in:\n";
    echo "1. MySQL Workbench: SELECT * FROM payments;\n";
    echo "2. Frontend: http://localhost:3000/payments\n";
    
} catch(PDOException $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}

