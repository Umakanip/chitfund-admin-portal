<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['username']) || !isset($data['password'])) {
    sendResponse(false, null, 'Username and password required', 400);
}

try {
    $stmt = $conn->prepare("SELECT id, username, email, name, role, password FROM users WHERE username = ?");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();

    if ($user) {
        // For demo, accept 'password' and 'test' as plain text, otherwise verify hashed password
        if ($data['password'] === 'password' || $data['password'] === 'test' || password_verify($data['password'], $user['password'])) {
            $token = 'token-' . $user['id'];
            sendResponse(true, [
                'user' => [
                    'id' => (string)$user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'role' => $user['role']
                ],
                'token' => $token
            ], 'Login successful');
        }
    }
    
    sendResponse(false, null, 'Invalid credentials', 401);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

