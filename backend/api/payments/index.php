<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $stmt = $conn->query("SELECT p.id, p.customer_id as customerId, c.name as customerName, 
                          p.scheme_id as schemeId, s.name as schemeName, p.amount, 
                          p.payment_date as paymentDate, p.month, p.status 
                          FROM payments p 
                          LEFT JOIN customers c ON p.customer_id = c.id 
                          LEFT JOIN chit_schemes s ON p.scheme_id = s.id 
                          ORDER BY p.id DESC");
    $payments = $stmt->fetchAll();
    
    foreach ($payments as &$payment) {
        $payment['id'] = (string)$payment['id'];
        $payment['customerId'] = (string)$payment['customerId'];
        $payment['schemeId'] = (string)$payment['schemeId'];
        $payment['amount'] = (float)$payment['amount'];
        $payment['paymentDate'] = $payment['paymentDate'] ?: '';
    }
    
    sendResponse(true, $payments);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

