<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$id = $_GET['id'] ?? null;

if (!$id) {
    sendResponse(false, null, 'Customer ID required', 400);
}

try {
    $stmt = $conn->prepare("SELECT id, name, email, phone, address, aadhar_number as aadharNumber, 
                            pan_number as panNumber, status, created_at as createdAt 
                            FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();
    
    if (!$customer) {
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    $customer['id'] = (string)$customer['id'];
    sendResponse(true, $customer);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

