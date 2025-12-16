<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->query("SELECT id, name, email, phone, address, aadhar_number as aadharNumber, 
                             pan_number as panNumber, status, created_at as createdAt 
                             FROM customers ORDER BY id DESC");
        $customers = $stmt->fetchAll();
        
        // Convert IDs to strings
        foreach ($customers as &$customer) {
            $customer['id'] = (string)$customer['id'];
        }
        
        sendResponse(true, $customers);
    } catch(PDOException $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("INSERT INTO customers (name, email, phone, address, aadhar_number, pan_number, status) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            $data['address'],
            $data['aadharNumber'],
            $data['panNumber'],
            $data['status'] ?? 'active'
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT id, name, email, phone, address, aadhar_number as aadharNumber, 
                               pan_number as panNumber, status, created_at as createdAt 
                               FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        $customer = $stmt->fetch();
        $customer['id'] = (string)$customer['id'];
        
        sendResponse(true, $customer, 'Customer added successfully', 201);
    } catch(PDOException $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else {
    sendResponse(false, null, 'Method not allowed', 405);
}

