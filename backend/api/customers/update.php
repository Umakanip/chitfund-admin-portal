<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$id = $_GET['id'] ?? null;
$data = json_decode(file_get_contents('php://input'), true);

if (!$id) {
    sendResponse(false, null, 'Customer ID required', 400);
}

try {
    $stmt = $conn->prepare("UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, 
                           aadhar_number = ?, pan_number = ?, status = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['email'],
        $data['phone'],
        $data['address'],
        $data['aadharNumber'],
        $data['panNumber'],
        $data['status'],
        $id
    ]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    $stmt = $conn->prepare("SELECT id, name, email, phone, address, aadhar_number as aadharNumber, 
                           pan_number as panNumber, status, created_at as createdAt 
                           FROM customers WHERE id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();
    $customer['id'] = (string)$customer['id'];
    
    sendResponse(true, $customer, 'Customer updated successfully');
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

