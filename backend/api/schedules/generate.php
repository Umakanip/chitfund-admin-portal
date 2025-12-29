<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);
$schemeId = $data['schemeId'] ?? null;

if (!$schemeId) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $conn->beginTransaction();
    
    // Get scheme details
    $schemeStmt = $conn->prepare("SELECT id, duration, chit_type FROM chit_schemes WHERE id = ?");
    $schemeStmt->execute([$schemeId]);
    $scheme = $schemeStmt->fetch();
    
    if (!$scheme) {
        $conn->rollBack();
        sendResponse(false, null, 'Chit scheme not found', 404);
    }
    
    $duration = $scheme['duration'];
    $chitType = $scheme['chit_type'];
    
    // Check if schedule already exists
    $checkStmt = $conn->prepare("SELECT COUNT(*) FROM chit_schedules WHERE scheme_id = ?");
    $checkStmt->execute([$schemeId]);
    $existingCount = $checkStmt->fetchColumn();
    
    if ($existingCount > 0) {
        $conn->rollBack();
        sendResponse(false, null, 'Schedule already exists for this scheme. Delete existing schedule first.', 400);
    }
    
    // Generate schedule rows for all months
    for ($month = 1; $month <= $duration; $month++) {
        $stmt = $conn->prepare("INSERT INTO chit_schedules (scheme_id, month_number, allocation_type, status) 
                               VALUES (?, ?, ?, 'pending')");
        $allocationType = $chitType === 'fixed' ? 'fixed' : 'pending';
        $stmt->execute([$schemeId, $month, $allocationType]);
    }
    
    $conn->commit();
    sendResponse(true, ['message' => "Schedule generated for {$duration} months"], 'Schedule generated successfully', 201);
    
} catch(PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    $errorMessage = $e->getMessage();
    // Check if table doesn't exist
    if (strpos($errorMessage, "doesn't exist") !== false || strpos($errorMessage, "Unknown table") !== false) {
        sendResponse(false, null, 'Chit schedules table does not exist. Please run the migration script: php backend/migrate_add_chit_schedules_table.php', 500);
    } else {
        sendResponse(false, null, 'Database error: ' . $errorMessage, 500);
    }
} catch(Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendResponse(false, null, 'Error: ' . $e->getMessage(), 500);
}

