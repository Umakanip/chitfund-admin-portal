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
    $stmt = $conn->prepare("SELECT c.id, c.name, c.email, c.phone, c.whatsapp_number as whatsappNumber, 
                            c.address, c.city, c.aadhar_number as aadharNumber, 
                            c.pan_number as panNumber, c.status, c.created_at as createdAt,
                            cs.scheme_id as schemeId,
                            s.name as schemeName
                            FROM customers c
                            LEFT JOIN customer_schemes cs ON c.id = cs.customer_id AND cs.status = 'active'
                            LEFT JOIN chit_schemes s ON cs.scheme_id = s.id
                            WHERE c.id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();
    
    if (!$customer) {
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    $customer['id'] = (string)$customer['id'];
    $customer['schemeId'] = $customer['schemeId'] ? (string)$customer['schemeId'] : '';
    $customer['schemeName'] = $customer['schemeName'] ? $customer['schemeName'] : '';
    
    sendResponse(true, $customer);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

