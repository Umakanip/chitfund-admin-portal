<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$schemeId = $data['schemeId'] ?? null;

if (!$schemeId) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $conn->beginTransaction();
    
    // Get scheme details
    $schemeStmt = $conn->prepare("SELECT id, duration, total_amount, chit_type FROM chit_schemes WHERE id = ?");
    $schemeStmt->execute([$schemeId]);
    $scheme = $schemeStmt->fetch();
    
    if (!$scheme) {
        $conn->rollBack();
        sendResponse(false, null, 'Chit scheme not found', 404);
    }
    
    // Get all active members of this scheme
    $membersStmt = $conn->prepare("SELECT DISTINCT customer_id FROM customer_schemes 
                                   WHERE scheme_id = ? AND status = 'active'");
    $membersStmt->execute([$schemeId]);
    $members = $membersStmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($members)) {
        $conn->rollBack();
        sendResponse(false, null, 'No active members found for this scheme', 400);
    }
    
    // Get all schedules for this scheme
    $schedulesStmt = $conn->prepare("SELECT id, month_number FROM chit_schedules 
                                     WHERE scheme_id = ? 
                                     ORDER BY month_number ASC");
    $schedulesStmt->execute([$schemeId]);
    $allSchedules = $schedulesStmt->fetchAll();
    
    if (empty($allSchedules)) {
        $conn->rollBack();
        sendResponse(false, null, 'No schedule found for this scheme. Please generate schedule first.', 400);
    }
    
    // Clear all existing allocations
    $clearStmt = $conn->prepare("UPDATE chit_schedules SET customer_id = NULL, allocation_date = NULL, 
                                 amount_received = NULL, status = 'pending',
                                 allocation_type = CASE WHEN allocation_type = 'fixed' THEN 'fixed' ELSE 'pending' END
                                 WHERE scheme_id = ?");
    $clearStmt->execute([$schemeId]);
    
    // Distribute members across all months using round-robin
    $memberCount = count($members);
    $scheduleCount = count($allSchedules);
    $memberIndex = 0;
    $memberAllocationCount = [];
    
    // Initialize allocation count for each member
    foreach ($members as $memberId) {
        $memberAllocationCount[$memberId] = 0;
    }
    
    // Allocate members to schedules
    foreach ($allSchedules as $schedule) {
        // Select member (round-robin distribution)
        $memberId = $members[$memberIndex % $memberCount];
        
        // Calculate amount (for fixed chit, use total_amount; for auction, can be null)
        $amountReceived = null;
        if ($scheme['chit_type'] === 'fixed') {
            $amountReceived = $scheme['total_amount'];
        }
        
        // Update schedule
        $updateStmt = $conn->prepare("UPDATE chit_schedules SET customer_id = ?, allocation_date = CURRENT_DATE, 
                                      amount_received = ?, status = 'allocated',
                                      allocation_type = CASE WHEN allocation_type = 'pending' THEN ? ELSE allocation_type END
                                      WHERE id = ?");
        $allocationType = $scheme['chit_type'] === 'fixed' ? 'fixed' : 'auction';
        $updateStmt->execute([$memberId, $amountReceived, $allocationType, $schedule['id']]);
        
        $memberAllocationCount[$memberId]++;
        $memberIndex++;
    }
    
    $conn->commit();
    
    // Build summary
    $summary = [];
    foreach ($memberAllocationCount as $memberId => $count) {
        $customerStmt = $conn->prepare("SELECT name FROM customers WHERE id = ?");
        $customerStmt->execute([$memberId]);
        $customer = $customerStmt->fetch();
        $summary[] = [
            'customerId' => (string)$memberId,
            'customerName' => $customer['name'],
            'allocations' => $count
        ];
    }
    
    sendResponse(true, [
        'message' => "Redistributed {$scheduleCount} month(s) among {$memberCount} member(s)",
        'summary' => $summary
    ], 'Redistribution completed successfully');
    
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

