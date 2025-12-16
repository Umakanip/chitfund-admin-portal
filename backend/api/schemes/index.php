<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->query("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                             start_date as startDate, end_date as endDate, status, total_members as totalMembers, 
                             current_members as currentMembers FROM chit_schemes ORDER BY id DESC");
        $schemes = $stmt->fetchAll();
        
        foreach ($schemes as &$scheme) {
            $scheme['id'] = (string)$scheme['id'];
            $scheme['totalAmount'] = (float)$scheme['totalAmount'];
            $scheme['monthlyInstallment'] = (float)$scheme['monthlyInstallment'];
        }
        
        sendResponse(true, $schemes);
    } catch(PDOException $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("INSERT INTO chit_schemes (name, total_amount, duration, monthly_installment, 
                                start_date, end_date, status, total_members, current_members) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['totalAmount'],
            $data['duration'],
            $data['monthlyInstallment'],
            $data['startDate'],
            $data['endDate'],
            $data['status'] ?? 'active',
            $data['totalMembers'],
            $data['currentMembers'] ?? 0
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                               start_date as startDate, end_date as endDate, status, total_members as totalMembers, 
                               current_members as currentMembers FROM chit_schemes WHERE id = ?");
        $stmt->execute([$id]);
        $scheme = $stmt->fetch();
        $scheme['id'] = (string)$scheme['id'];
        $scheme['totalAmount'] = (float)$scheme['totalAmount'];
        $scheme['monthlyInstallment'] = (float)$scheme['monthlyInstallment'];
        
        sendResponse(true, $scheme, 'Scheme created successfully', 201);
    } catch(PDOException $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else {
    sendResponse(false, null, 'Method not allowed', 405);
}

