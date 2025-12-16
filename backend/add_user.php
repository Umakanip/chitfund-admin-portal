<?php
/**
 * Add New User Script
 * Run this to add a new user to the database
 */

require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    die("ERROR: Failed to connect to database\n");
}

echo "=== Adding New User ===\n\n";

try {
    // User details
    $username = 'Umakani';
    $email = 'uma@gmail.com';
    $password = 'test';
    $name = 'Umakani';
    $role = 'manager'; // or 'admin' if needed
    
    // Check if user already exists
    $checkStmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $checkStmt->execute([$username, $email]);
    $exists = $checkStmt->fetchColumn();
    
    if ($exists > 0) {
        echo "WARNING: User with username '$username' or email '$email' already exists.\n";
        echo "Do you want to update the password? (y/n): ";
        $handle = fopen("php://stdin", "r");
        $line = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($line) === 'y') {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE username = ?");
            $updateStmt->execute([$hashedPassword, $username]);
            echo "✓ Password updated successfully!\n";
        } else {
            echo "Cancelled.\n";
            exit;
        }
    } else {
        // Hash the password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert new user
        $stmt = $conn->prepare("INSERT INTO users (username, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$username, $email, $hashedPassword, $name, $role]);
        
        echo "✓ User added successfully!\n\n";
        echo "User Details:\n";
        echo "  Username: $username\n";
        echo "  Email: $email\n";
        echo "  Password: $password\n";
        echo "  Name: $name\n";
        echo "  Role: $role\n\n";
    }
    
    // Display all users
    echo "=== All Users ===\n";
    $usersStmt = $conn->query("SELECT id, username, email, name, role FROM users ORDER BY id");
    $users = $usersStmt->fetchAll();
    
    foreach ($users as $user) {
        echo "  ID: {$user['id']} | Username: {$user['username']} | Email: {$user['email']} | Name: {$user['name']} | Role: {$user['role']}\n";
    }
    
    echo "\n✓ Done!\n";
    
} catch(PDOException $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}

