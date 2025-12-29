<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$schemeId = $_GET['schemeId'] ?? null;

if (!$schemeId) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    // Get all active members of this scheme
    $membersStmt = $conn->prepare("SELECT DISTINCT c.id, c.name, c.email, c.phone 
                                   FROM customers c
                                   INNER JOIN customer_schemes cs ON c.id = cs.customer_id
                                   WHERE cs.scheme_id = ? AND cs.status = 'active' AND c.status = 'active'
                                   ORDER BY c.name ASC");
    $membersStmt->execute([$schemeId]);
    $members = $membersStmt->fetchAll();
    
    // Get allocation count for each member
    $summary = [];
    foreach ($members as $member) {
        $countStmt = $conn->prepare("SELECT COUNT(*) FROM chit_schedules 
                                     WHERE scheme_id = ? AND customer_id = ?");
        $countStmt->execute([$schemeId, $member['id']]);
        $allocationCount = $countStmt->fetchColumn();
        
        $summary[] = [
            'customerId' => (string)$member['id'],
            'customerName' => $member['name'],
            'customerEmail' => $member['email'],
            'customerPhone' => $member['phone'],
            'allocationCount' => (int)$allocationCount
        ];
    }
    
    // Get total months in schedule
    $totalStmt = $conn->prepare("SELECT COUNT(*) FROM chit_schedules WHERE scheme_id = ?");
    $totalStmt->execute([$schemeId]);
    $totalMonths = $totalStmt->fetchColumn();
    
    sendResponse(true, [
        'members' => $summary,
        'totalMonths' => (int)$totalMonths,
        'totalMembers' => count($summary)
    ]);
    
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

