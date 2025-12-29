<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$scheduleId = $data['scheduleId'] ?? null;
$customerId = $data['customerId'] ?? null;
$allocationDate = $data['allocationDate'] ?? date('Y-m-d');
$amountReceived = $data['amountReceived'] ?? null;

if (!$scheduleId) {
    sendResponse(false, null, 'Schedule ID required', 400);
}

// Allow empty customerId to remove allocation
if ($customerId === '' || $customerId === null) {
    $customerId = null;
}

try {
    $conn->beginTransaction();
    
    // Get schedule details
    $scheduleStmt = $conn->prepare("SELECT scheme_id, month_number FROM chit_schedules WHERE id = ?");
    $scheduleStmt->execute([$scheduleId]);
    $schedule = $scheduleStmt->fetch();
    
    if (!$schedule) {
        $conn->rollBack();
        sendResponse(false, null, 'Schedule not found', 404);
    }
    
    // Verify customer exists if provided
    if ($customerId) {
        $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
        $customerStmt->execute([$customerId]);
        if (!$customerStmt->fetch()) {
            $conn->rollBack();
            sendResponse(false, null, 'Customer not found', 404);
        }
    }
    
    // Update schedule
    if ($customerId) {
        // Assign customer
        $updateStmt = $conn->prepare("UPDATE chit_schedules SET customer_id = ?, allocation_date = ?, 
                                      amount_received = ?, status = 'allocated', 
                                      allocation_type = CASE WHEN allocation_type = 'pending' THEN 'auction' ELSE allocation_type END
                                      WHERE id = ?");
        $updateStmt->execute([$customerId, $allocationDate, $amountReceived, $scheduleId]);
    } else {
        // Remove allocation
        $updateStmt = $conn->prepare("UPDATE chit_schedules SET customer_id = NULL, allocation_date = NULL, 
                                      amount_received = NULL, status = 'pending'
                                      WHERE id = ?");
        $updateStmt->execute([$scheduleId]);
    }
    
    $conn->commit();
    sendResponse(true, ['message' => 'Customer allocated successfully'], 'Allocation updated successfully');
    
} catch(PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

