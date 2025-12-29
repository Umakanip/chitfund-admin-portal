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

$schemeId = $_GET['schemeId'] ?? null;

if (!$schemeId) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    // Get all entries (including duplicates) for this scheme
    // Show each entry separately so customers added multiple times appear multiple times
    $stmt = $conn->prepare("SELECT cs.id as entryId, cs.customer_id, cs.scheme_id, cs.status as entryStatus, cs.created_at as entryDate,
                           c.id, c.name, c.email, c.phone, c.whatsapp_number as whatsappNumber,
                           c.address, c.city, c.aadhar_number as aadharNumber, c.pan_number as panNumber,
                           c.status, c.created_at as createdAt
                           FROM customer_schemes cs
                           INNER JOIN customers c ON cs.customer_id = c.id
                           WHERE cs.scheme_id = ?
                           ORDER BY cs.created_at ASC, c.name ASC");
    $stmt->execute([$schemeId]);
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert IDs to strings and add entry number for each customer
    // First pass: count total entries per customer
    $customerCounts = [];
    foreach ($members as $member) {
        $customerId = (string)$member['customer_id'];
        if (!isset($customerCounts[$customerId])) {
            $customerCounts[$customerId] = 0;
        }
        $customerCounts[$customerId]++;
    }
    
    // Second pass: add entry numbers and totals
    $customerCurrentCounts = []; // Track current entry number for each customer
    foreach ($members as &$member) {
        $customerId = (string)$member['customer_id'];
        
        // Increment current count for this customer
        if (!isset($customerCurrentCounts[$customerId])) {
            $customerCurrentCounts[$customerId] = 0;
        }
        $customerCurrentCounts[$customerId]++;
        
        $member['id'] = (string)$member['id'];
        $member['customer_id'] = (string)$member['customer_id'];
        $member['schemeId'] = (string)$member['scheme_id'];
        $member['entryId'] = (string)$member['entryId'];
        $member['entryNumber'] = $customerCurrentCounts[$customerId]; // 1, 2, 3, etc.
        $member['totalEntriesForCustomer'] = $customerCounts[$customerId]; // Total times this customer appears
    }
    
    // Log for debugging
    error_log("Scheme ID: $schemeId, Total entries found: " . count($members));
    
    ob_end_clean(); // Clear any buffered output before sending JSON
    sendResponse(true, $members);
    
} catch(PDOException $e) {
    ob_end_clean(); // Clear any buffered output before sending error
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

