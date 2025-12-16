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
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $stmt = $conn->prepare("UPDATE chit_schemes SET name = ?, total_amount = ?, duration = ?, monthly_installment = ?, 
                           start_date = ?, end_date = ?, status = ?, total_members = ?, current_members = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['totalAmount'],
        $data['duration'],
        $data['monthlyInstallment'],
        $data['startDate'],
        $data['endDate'],
        $data['status'],
        $data['totalMembers'],
        $data['currentMembers'],
        $id
    ]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(false, null, 'Scheme not found', 404);
    }
    
    $stmt = $conn->prepare("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                           start_date as startDate, end_date as endDate, status, total_members as totalMembers, 
                           current_members as currentMembers FROM chit_schemes WHERE id = ?");
    $stmt->execute([$id]);
    $scheme = $stmt->fetch();
    $scheme['id'] = (string)$scheme['id'];
    $scheme['totalAmount'] = (float)$scheme['totalAmount'];
    $scheme['monthlyInstallment'] = (float)$scheme['monthlyInstallment'];
    
    sendResponse(true, $scheme, 'Scheme updated successfully');
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

