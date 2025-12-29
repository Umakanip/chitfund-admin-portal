<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$schemeId = $data['schemeId'] ?? null;
$customerIds = $data['customerIds'] ?? [];

if (!$schemeId) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

if (empty($customerIds) || !is_array($customerIds)) {
    sendResponse(false, null, 'Customer IDs array required', 400);
}

try {
    $conn->beginTransaction();
    
    // Get scheme details
    $schemeStmt = $conn->prepare("SELECT id, total_members, current_members FROM chit_schemes WHERE id = ?");
    $schemeStmt->execute([$schemeId]);
    $scheme = $schemeStmt->fetch();
    
    if (!$scheme) {
        $conn->rollBack();
        sendResponse(false, null, 'Chit scheme not found', 404);
    }
    
    $added = 0;
    $skipped = [];
    $errors = [];
    
    foreach ($customerIds as $customerId) {
        // Verify customer exists
        $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
        $customerStmt->execute([$customerId]);
        if (!$customerStmt->fetch()) {
            $errors[] = "Customer ID {$customerId} not found";
            continue;
        }
        
        // Count ALL current entries (including duplicates) for this scheme
        $totalEntriesStmt = $conn->prepare("SELECT COUNT(*) FROM customer_schemes WHERE scheme_id = ? AND status = 'active'");
        $totalEntriesStmt->execute([$schemeId]);
        $currentTotalEntries = (int)$totalEntriesStmt->fetchColumn();
        
        // Check if scheme has reached its limit (e.g., 20/20 is OK, 21/20 is NOT)
        if ($currentTotalEntries >= $scheme['total_members']) {
            $errors[] = "Scheme is full ({$currentTotalEntries}/{$scheme['total_members']}). Cannot add more members.";
            break;
        }
        
        // Try to add membership (allow duplicates)
        try {
            $linkStmt = $conn->prepare("INSERT INTO customer_schemes (customer_id, scheme_id, status) VALUES (?, ?, 'active')");
            $linkStmt->execute([$customerId, $schemeId]);
            
            // Update scheme's current_members count
            $updateStmt = $conn->prepare("UPDATE chit_schemes SET current_members = current_members + 1 WHERE id = ?");
            $updateStmt->execute([$schemeId]);
            
            // Refresh scheme data for next iteration
            $schemeStmt->execute([$schemeId]);
            $scheme = $schemeStmt->fetch();
            
            $added++;
        } catch (PDOException $e) {
            // If duplicate entry error, check if it's due to unique constraint
            if ($e->getCode() == 23000 && strpos($e->getMessage(), 'Duplicate entry') !== false) {
                // Check if we can still add more entries
                $totalEntriesStmt->execute([$schemeId]);
                $newTotal = (int)$totalEntriesStmt->fetchColumn();
                
                if ($newTotal >= $scheme['total_members']) {
                    $errors[] = "Scheme is full. Cannot add more members.";
                    break;
                } else {
                    // Try to remove unique constraint or handle gracefully
                    // For now, skip this customer
                    $skipped[] = $customerId . " (duplicate entry - constraint exists)";
                    continue;
                }
            } else {
                throw $e; // Re-throw if it's a different error
            }
        }
    }
    
    $conn->commit();
    
    $message = "Added {$added} customer(s) to the scheme.";
    if (!empty($skipped)) {
        $message .= " " . count($skipped) . " customer(s) skipped (already members or scheme full).";
    }
    if (!empty($errors)) {
        $message .= " Errors: " . implode(', ', $errors);
    }
    
    sendResponse(true, [
        'added' => $added,
        'skipped' => count($skipped),
        'errors' => $errors
    ], $message);
    
} catch(PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
} catch(Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendResponse(false, null, 'Error: ' . $e->getMessage(), 500);
}

