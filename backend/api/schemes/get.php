<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$id = $_GET['id'] ?? null;

if (!$id) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $stmt = $conn->prepare("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                            start_date as startDate, end_date as endDate, chit_frequency as chitFrequency, 
                            chit_type as chitType, status, total_members as totalMembers, 
                            current_members as currentMembers FROM chit_schemes WHERE id = ?");
    $stmt->execute([$id]);
    $scheme = $stmt->fetch();
    
    if (!$scheme) {
        sendResponse(false, null, 'Scheme not found', 404);
    }
    
    $scheme['id'] = (string)$scheme['id'];
    $scheme['totalAmount'] = (float)$scheme['totalAmount'];
    $scheme['monthlyInstallment'] = (float)$scheme['monthlyInstallment'];
    
    sendResponse(true, $scheme);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

