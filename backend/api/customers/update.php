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
    sendResponse(false, null, 'Customer ID required', 400);
}

try {
    // Start transaction
    $conn->beginTransaction();
    
    // First, verify customer exists
    $checkStmt = $conn->prepare("SELECT id FROM customers WHERE id = ?");
    $checkStmt->execute([$id]);
    if (!$checkStmt->fetch()) {
        $conn->rollBack();
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    // Update customer
    $stmt = $conn->prepare("UPDATE customers SET name = ?, email = ?, phone = ?, whatsapp_number = ?, 
                           address = ?, city = ?, aadhar_number = ?, pan_number = ?, status = ? WHERE id = ?");
    $stmt->execute([
        $data['name'],
        $data['email'],
        $data['phone'],
        $data['whatsappNumber'] ?? null,
        $data['address'],
        $data['city'] ?? null,
        $data['aadharNumber'],
        $data['panNumber'],
        $data['status'],
        $id
    ]);
    
    // Handle scheme relationship if provided
    if (isset($data['schemeId'])) {
        // Get all current active schemes for this customer
        $currentStmt = $conn->prepare("SELECT DISTINCT scheme_id FROM customer_schemes WHERE customer_id = ? AND status = 'active'");
        $currentStmt->execute([$id]);
        $currentSchemes = $currentStmt->fetchAll(PDO::FETCH_COLUMN);
        
        $newSchemeId = !empty($data['schemeId']) ? $data['schemeId'] : null;
        
        // Add new membership if scheme is provided
        if ($newSchemeId) {
            // If customer is switching from different scheme(s), cancel old ones first
            if (!empty($currentSchemes) && !in_array($newSchemeId, $currentSchemes)) {
                // Deactivate all old scheme relationships (handle multiple memberships)
                foreach ($currentSchemes as $oldSchemeId) {
                    // Count how many active memberships to cancel
                    $countStmt = $conn->prepare("SELECT COUNT(*) FROM customer_schemes WHERE customer_id = ? AND scheme_id = ? AND status = 'active'");
                    $countStmt->execute([$id, $oldSchemeId]);
                    $membershipCount = $countStmt->fetchColumn();
                    
                    // Cancel all memberships for this scheme
                    $deactivateStmt = $conn->prepare("UPDATE customer_schemes SET status = 'cancelled' WHERE customer_id = ? AND scheme_id = ? AND status = 'active'");
                    $deactivateStmt->execute([$id, $oldSchemeId]);
                    
                    // Decrease old scheme's current_members count by the number of cancelled memberships
                    $decreaseStmt = $conn->prepare("UPDATE chit_schemes SET current_members = GREATEST(0, current_members - ?) WHERE id = ?");
                    $decreaseStmt->execute([$membershipCount, $oldSchemeId]);
                }
            }
            
            // Add new membership to the selected scheme
            // Verify scheme exists and has available slots
            $checkStmt = $conn->prepare("SELECT id, current_members, total_members FROM chit_schemes WHERE id = ?");
            $checkStmt->execute([$newSchemeId]);
            $scheme = $checkStmt->fetch();
            
            if (!$scheme) {
                $conn->rollBack();
                sendResponse(false, null, 'Chit scheme not found', 400);
            }
            
            // Calculate available slots
            $availableSlots = $scheme['total_members'] - $scheme['current_members'];
            if ($availableSlots <= 0) {
                $conn->rollBack();
                sendResponse(false, null, 'Chit scheme is full. Cannot add more members.', 400);
            }
            
            // Count how many times this customer is already a member of this scheme
            $memberCountStmt = $conn->prepare("SELECT COUNT(*) FROM customer_schemes WHERE customer_id = ? AND scheme_id = ? AND status = 'active'");
            $memberCountStmt->execute([$id, $newSchemeId]);
            $existingMemberships = $memberCountStmt->fetchColumn();
            
            // Check if customer can join (they can join up to the number of available slots)
            if ($existingMemberships >= $availableSlots) {
                $conn->rollBack();
                sendResponse(false, null, "Chit scheme has {$availableSlots} available slot(s). Customer already has {$existingMemberships} active membership(s). Cannot exceed available slots.", 400);
            }
            
            // Create new relationship (allow multiple memberships)
            $linkStmt = $conn->prepare("INSERT INTO customer_schemes (customer_id, scheme_id, status) VALUES (?, ?, 'active')");
            $linkStmt->execute([$id, $newSchemeId]);
            
            // Increase new scheme's current_members count
            $increaseStmt = $conn->prepare("UPDATE chit_schemes SET current_members = current_members + 1 WHERE id = ?");
            $increaseStmt->execute([$newSchemeId]);
        }
    }
    
    // Commit transaction
    $conn->commit();
    
    // Fetch updated customer with scheme
    $stmt = $conn->prepare("SELECT c.id, c.name, c.email, c.phone, c.whatsapp_number as whatsappNumber, 
                           c.address, c.city, c.aadhar_number as aadharNumber, 
                           c.pan_number as panNumber, c.status, c.created_at as createdAt,
                           cs.scheme_id as schemeId,
                           s.name as schemeName
                           FROM customers c
                           LEFT JOIN customer_schemes cs ON c.id = cs.customer_id AND cs.status = 'active'
                           LEFT JOIN chit_schemes s ON cs.scheme_id = s.id
                           WHERE c.id = ?");
    $stmt->execute([$id]);
    $customer = $stmt->fetch();
    
    if (!$customer) {
        $conn->rollBack();
        sendResponse(false, null, 'Customer not found after update', 404);
    }
    
    $customer['id'] = (string)$customer['id'];
    $customer['schemeId'] = $customer['schemeId'] ? (string)$customer['schemeId'] : '';
    $customer['schemeName'] = $customer['schemeName'] ? $customer['schemeName'] : '';
    
    sendResponse(true, $customer, 'Customer updated successfully');
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

