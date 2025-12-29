<?php
// Suppress error output for API responses and start output buffering
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ob_start(); // Start output buffering to catch any stray output

require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->query("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                             start_date as startDate, end_date as endDate, chit_frequency as chitFrequency, 
                             chit_type as chitType, status, total_members as totalMembers, 
                             current_members as currentMembers FROM chit_schemes ORDER BY id DESC");
        $schemes = $stmt->fetchAll();
        
        // Calculate actual member count from customer_schemes for each scheme
        foreach ($schemes as &$scheme) {
            $schemeId = $scheme['id'];
            
            // Count ALL entries (including duplicates) from customer_schemes table
            // This allows customers to be added multiple times up to the limit
            $countStmt = $conn->prepare("SELECT COUNT(*) as actual_count FROM customer_schemes WHERE scheme_id = ? AND status = 'active'");
            $countStmt->execute([$schemeId]);
            $countResult = $countStmt->fetch();
            $actualCount = isset($countResult['actual_count']) ? (int)$countResult['actual_count'] : 0;
            
            // Use actual count instead of stored current_members
            $scheme['currentMembers'] = $actualCount;
            
            // Optionally update the database to keep it in sync
            $storedCount = isset($scheme['current_members']) ? (int)$scheme['current_members'] : 0;
            if ($actualCount != $storedCount) {
                $updateStmt = $conn->prepare("UPDATE chit_schemes SET current_members = ? WHERE id = ?");
                $updateStmt->execute([$actualCount, $schemeId]);
            }
            
            $scheme['id'] = (string)$scheme['id'];
            $scheme['totalAmount'] = isset($scheme['totalAmount']) ? (float)$scheme['totalAmount'] : 0;
            $scheme['monthlyInstallment'] = isset($scheme['monthlyInstallment']) ? (float)$scheme['monthlyInstallment'] : 0;
        }
        
        ob_end_clean(); // Clear any buffered output before sending JSON
        sendResponse(true, $schemes);
    } catch(PDOException $e) {
        ob_end_clean(); // Clear any buffered output before sending error
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("INSERT INTO chit_schemes (name, total_amount, duration, monthly_installment, 
                                start_date, end_date, chit_frequency, chit_type, status, total_members, current_members) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['totalAmount'],
            $data['duration'],
            $data['monthlyInstallment'],
            $data['startDate'],
            $data['endDate'],
            $data['chitFrequency'] ?? 'month',
            $data['chitType'] ?? 'auction',
            $data['status'] ?? 'active',
            $data['totalMembers'],
            $data['currentMembers'] ?? 0
        ]);
        
        $id = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT id, name, total_amount as totalAmount, duration, monthly_installment as monthlyInstallment, 
                               start_date as startDate, end_date as endDate, chit_frequency as chitFrequency, 
                               chit_type as chitType, status, total_members as totalMembers, 
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

