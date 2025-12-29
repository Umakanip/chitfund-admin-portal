<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get unique customers first, then get their scheme info separately
        $stmt = $conn->query("SELECT DISTINCT c.id, c.name, c.email, c.phone, c.whatsapp_number as whatsappNumber, 
                             c.address, c.city, c.aadhar_number as aadharNumber, 
                             c.pan_number as panNumber, c.status, c.created_at as createdAt
                             FROM customers c
                             ORDER BY c.id DESC");
        $customers = $stmt->fetchAll();
        
        // Get scheme info for each customer (get first active scheme)
        foreach ($customers as &$customer) {
            $customerId = $customer['id'];
            $schemeStmt = $conn->prepare("SELECT cs.scheme_id, s.name as schemeName
                                          FROM customer_schemes cs
                                          LEFT JOIN chit_schemes s ON cs.scheme_id = s.id
                                          WHERE cs.customer_id = ? AND cs.status = 'active'
                                          LIMIT 1");
            $schemeStmt->execute([$customerId]);
            $scheme = $schemeStmt->fetch();
            
            $customer['id'] = (string)$customer['id'];
            $customer['schemeId'] = $scheme ? (string)$scheme['scheme_id'] : '';
            $customer['schemeName'] = $scheme ? $scheme['schemeName'] : '';
        }
        
        sendResponse(true, $customers);
    } catch(PDOException $e) {
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // Insert customer
        $stmt = $conn->prepare("INSERT INTO customers (name, email, phone, whatsapp_number, address, city, aadhar_number, pan_number, status) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            $data['whatsappNumber'] ?? null,
            $data['address'],
            $data['city'] ?? null,
            $data['aadharNumber'],
            $data['panNumber'],
            $data['status'] ?? 'active'
        ]);
        
        $customerId = $conn->lastInsertId();
        
        // Link customer to chit scheme if provided
        if (!empty($data['schemeId'])) {
            $schemeId = $data['schemeId'];
            
            // Verify scheme exists
            $checkStmt = $conn->prepare("SELECT id, current_members, total_members FROM chit_schemes WHERE id = ?");
            $checkStmt->execute([$schemeId]);
            $scheme = $checkStmt->fetch();
            
            if (!$scheme) {
                throw new Exception('Chit scheme not found');
            }
            
            // Check if scheme has available slots
            $availableSlots = $scheme['total_members'] - $scheme['current_members'];
            if ($availableSlots <= 0) {
                throw new Exception('Chit scheme is full. Cannot add more members.');
            }
            
            // Count how many times this customer is already a member of this scheme
            $memberCountStmt = $conn->prepare("SELECT COUNT(*) FROM customer_schemes WHERE customer_id = ? AND scheme_id = ? AND status = 'active'");
            $memberCountStmt->execute([$customerId, $schemeId]);
            $existingMemberships = $memberCountStmt->fetchColumn();
            
            // Check if customer can join (they can join up to the number of available slots)
            if ($existingMemberships >= $availableSlots) {
                throw new Exception("Chit scheme has {$availableSlots} available slot(s). Customer already has {$existingMemberships} active membership(s). Cannot exceed available slots.");
            }
            
            // Insert into customer_schemes junction table
            $linkStmt = $conn->prepare("INSERT INTO customer_schemes (customer_id, scheme_id, status) VALUES (?, ?, 'active')");
            $linkStmt->execute([$customerId, $schemeId]);
            
            // Update scheme's current_members count
            $updateStmt = $conn->prepare("UPDATE chit_schemes SET current_members = current_members + 1 WHERE id = ?");
            $updateStmt->execute([$schemeId]);
        }
        
        // Commit transaction
        $conn->commit();
        
        // Fetch and return the created customer
        $stmt = $conn->prepare("SELECT id, name, email, phone, whatsapp_number as whatsappNumber, 
                               address, city, aadhar_number as aadharNumber, 
                               pan_number as panNumber, status, created_at as createdAt 
                               FROM customers WHERE id = ?");
        $stmt->execute([$customerId]);
        $customer = $stmt->fetch();
        $customer['id'] = (string)$customer['id'];
        
        sendResponse(true, $customer, 'Customer added successfully', 201);
    } catch(PDOException $e) {
        // Rollback transaction on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
    } catch(Exception $e) {
        // Rollback transaction on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        sendResponse(false, null, $e->getMessage(), 400);
    }
} else {
    sendResponse(false, null, 'Method not allowed', 405);
}

