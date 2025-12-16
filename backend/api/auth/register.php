<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
    sendResponse(false, null, 'All fields required', 400);
}

try {
    // Check if username or email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$data['username'], $data['email']]);
    if ($stmt->fetch()) {
        sendResponse(false, null, 'Username or email already exists', 400);
    }

    $password = password_hash($data['password'], PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, 'manager')");
    $stmt->execute([$data['username'], $data['email'], $password, $data['name']]);
    
    $userId = $conn->lastInsertId();
    $token = 'token-' . $userId;
    
    sendResponse(true, [
        'user' => [
            'id' => (string)$userId,
            'username' => $data['username'],
            'email' => $data['email'],
            'name' => $data['name'],
            'role' => 'manager'
        ],
        'token' => $token
    ], 'Registration successful');
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

