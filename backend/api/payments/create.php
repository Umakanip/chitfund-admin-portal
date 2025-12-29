<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$customerId = $data['customerId'] ?? null;
$schemeId = $data['schemeId'] ?? null;
$amount = $data['amount'] ?? null;
$paymentDate = $data['paymentDate'] ?? null;
$installmentNumber = $data['installmentNumber'] ?? $data['month'] ?? null;

if (!$customerId || !$schemeId || !$amount || !$installmentNumber) {
    sendResponse(false, null, 'Customer ID, Scheme ID, Amount, and Installment Number are required', 400);
}

try {
    $conn->beginTransaction();
    
    // Verify customer exists
    $customerStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
    $customerStmt->execute([$customerId]);
    if (!$customerStmt->fetch()) {
        $conn->rollBack();
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    // Verify scheme exists
    $schemeStmt = $conn->prepare("SELECT id FROM chit_schemes WHERE id = ?");
    $schemeStmt->execute([$schemeId]);
    if (!$schemeStmt->fetch()) {
        $conn->rollBack();
        sendResponse(false, null, 'Scheme not found', 404);
    }
    
    // Check if payment already exists for this installment
    $checkStmt = $conn->prepare("SELECT id, amount FROM payments WHERE customer_id = ? AND scheme_id = ? AND month = ?");
    $checkStmt->execute([$customerId, $schemeId, $installmentNumber]);
    $existingPayment = $checkStmt->fetch();
    
    if ($existingPayment) {
        // Add new amount to existing payment amount
        $newTotalAmount = floatval($existingPayment['amount']) + floatval($amount);
        $updateStmt = $conn->prepare("UPDATE payments SET amount = ?, payment_date = ?, status = 'paid' WHERE id = ?");
        $updateStmt->execute([$newTotalAmount, $paymentDate ?: date('Y-m-d'), $existingPayment['id']]);
        $paymentId = $existingPayment['id'];
        $finalAmount = $newTotalAmount;
    } else {
        // Create new payment
        $insertStmt = $conn->prepare("INSERT INTO payments (customer_id, scheme_id, amount, payment_date, month, status) VALUES (?, ?, ?, ?, ?, 'paid')");
        $insertStmt->execute([$customerId, $schemeId, $amount, $paymentDate ?: date('Y-m-d'), $installmentNumber]);
        $paymentId = $conn->lastInsertId();
        $finalAmount = floatval($amount);
    }
    
    $conn->commit();
    
    sendResponse(true, [
        'id' => (string)$paymentId,
        'customerId' => (string)$customerId,
        'schemeId' => (string)$schemeId,
        'amount' => (float)$finalAmount,
        'paymentDate' => $paymentDate ?: date('Y-m-d'),
        'installmentNumber' => (int)$installmentNumber,
        'status' => 'paid'
    ], 'Payment recorded successfully', 201);
    
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

