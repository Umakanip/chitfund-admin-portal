<?php
// Suppress error output for API responses and start output buffering
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ob_start(); // Start output buffering to catch any stray output

require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$id = $_GET['id'] ?? null;

if (!$id) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $stmt = $conn->prepare("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                            start_date as startDate, end_date as endDate, chit_frequency as chitFrequency, 
                            chit_type as chitType, status, total_members as totalMembers, 
                            current_members as currentMembers FROM chit_schemes WHERE id = ?");
    $stmt->execute([$id]);
    $scheme = $stmt->fetch();
    
    if (!$scheme) {
        sendResponse(false, null, 'Scheme not found', 404);
    }
    
    // Calculate actual member count from customer_schemes table
    // Count ALL entries (including duplicates) to allow multiple entries per customer
    $countStmt = $conn->prepare("SELECT COUNT(*) as actual_count FROM customer_schemes WHERE scheme_id = ? AND status = 'active'");
    $countStmt->execute([$id]);
    $countResult = $countStmt->fetch();
    $actualCount = isset($countResult['actual_count']) ? (int)$countResult['actual_count'] : 0;
    
    // Use actual count instead of stored current_members
    $scheme['currentMembers'] = $actualCount;
    
    // Update the database to keep it in sync
    $storedCount = isset($scheme['current_members']) ? (int)$scheme['current_members'] : 0;
    if ($actualCount != $storedCount) {
        $updateStmt = $conn->prepare("UPDATE chit_schemes SET current_members = ? WHERE id = ?");
        $updateStmt->execute([$actualCount, $id]);
    }
    
    $scheme['id'] = (string)$scheme['id'];
    $scheme['totalAmount'] = (float)$scheme['totalAmount'];
    $scheme['monthlyInstallment'] = (float)$scheme['monthlyInstallment'];
    
    ob_end_clean(); // Clear any buffered output before sending JSON
    sendResponse(true, $scheme);
} catch(PDOException $e) {
    ob_end_clean(); // Clear any buffered output before sending error
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

