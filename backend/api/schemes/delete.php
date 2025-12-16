<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$id = $_GET['id'] ?? null;

if (!$id) {
    sendResponse(false, null, 'Scheme ID required', 400);
}

try {
    $stmt = $conn->prepare("DELETE FROM chit_schemes WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        sendResponse(false, null, 'Scheme not found', 404);
    }
    
    sendResponse(true, null, 'Scheme deleted successfully');
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

