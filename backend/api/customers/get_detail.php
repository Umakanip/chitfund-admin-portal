<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$customerId = $_GET['id'] ?? null;

if (!$customerId) {
    sendResponse(false, null, 'Customer ID required', 400);
}

try {
    // Get customer details
    $customerStmt = $conn->prepare("SELECT id, name, email, phone, whatsapp_number as whatsappNumber, 
                                   address, city, aadhar_number as aadharNumber, pan_number as panNumber,
                                   status, created_at as createdAt FROM customers WHERE id = ?");
    $customerStmt->execute([$customerId]);
    $customer = $customerStmt->fetch();
    
    if (!$customer) {
        sendResponse(false, null, 'Customer not found', 404);
    }
    
    $customer['id'] = (string)$customer['id'];
    
    // Get all schemes this customer is part of
    $schemesStmt = $conn->prepare("SELECT cs.id as membershipId, cs.joined_date as joinedDate, cs.status as membershipStatus,
                                   s.id as schemeId, s.name as schemeName, s.total_amount as totalAmount,
                                   s.duration, s.monthly_installment as monthlyInstallment,
                                   s.chit_frequency as chitFrequency, s.chit_type as chitType,
                                   s.start_date as startDate, s.end_date as endDate,
                                   s.status as schemeStatus
                                   FROM customer_schemes cs
                                   INNER JOIN chit_schemes s ON cs.scheme_id = s.id
                                   WHERE cs.customer_id = ? AND cs.status = 'active'
                                   ORDER BY cs.joined_date DESC");
    $schemesStmt->execute([$customerId]);
    $schemes = $schemesStmt->fetchAll();
    
    // For each scheme, get payment status for each month/week
    $schemesWithPayments = [];
    foreach ($schemes as $scheme) {
        $schemeId = $scheme['schemeId'];
        $duration = (int)$scheme['duration'];
        $chitFrequency = $scheme['chitFrequency'];
        $startDate = $scheme['startDate'];
        
        // Get payment records for this customer in this scheme
        $paymentsStmt = $conn->prepare("SELECT id, scheme_id, amount, payment_date as paymentDate,
                                       due_date as dueDate, status, month_number as monthNumber
                                       FROM payments
                                       WHERE customer_id = ? AND scheme_id = ?
                                       ORDER BY month_number ASC");
        $paymentsStmt->execute([$customerId, $schemeId]);
        $payments = $paymentsStmt->fetchAll();
        
        // Create payment map by month number
        $paymentMap = [];
        foreach ($payments as $payment) {
            $paymentMap[$payment['monthNumber']] = $payment;
        }
        
        // Build schedule with payment status
        $schedule = [];
        for ($i = 1; $i <= $duration; $i++) {
            $payment = $paymentMap[$i] ?? null;
            
            // Calculate due date based on frequency
            $dueDate = null;
            if ($chitFrequency === 'week') {
                $weeksFromStart = ($i - 1) * 4; // Assuming 4 weeks per month
                $dueDateObj = new DateTime($startDate);
                $dueDateObj->modify("+{$weeksFromStart} weeks");
                $dueDate = $dueDateObj->format('Y-m-d');
            } else {
                $dueDateObj = new DateTime($startDate);
                $dueDateObj->modify("+{$i} months");
                $dueDate = $dueDateObj->format('Y-m-d');
            }
            
            // Determine status
            $status = 'pending';
            if ($payment) {
                $status = $payment['status'];
            } else {
                // Check if overdue
                $today = new DateTime();
                $dueDateObj = new DateTime($dueDate);
                if ($today > $dueDateObj) {
                    $status = 'overdue';
                }
            }
            
            $schedule[] = [
                'monthNumber' => $i,
                'dueDate' => $dueDate,
                'amount' => (float)$scheme['monthlyInstallment'],
                'status' => $status,
                'paymentDate' => $payment ? $payment['paymentDate'] : null,
                'paidAmount' => $payment ? (float)$payment['amount'] : null
            ];
        }
        
        $schemesWithPayments[] = [
            'membershipId' => (string)$scheme['membershipId'],
            'joinedDate' => $scheme['joinedDate'],
            'membershipStatus' => $scheme['membershipStatus'],
            'schemeId' => (string)$scheme['schemeId'],
            'schemeName' => $scheme['schemeName'],
            'totalAmount' => (float)$scheme['totalAmount'],
            'duration' => $duration,
            'monthlyInstallment' => (float)$scheme['monthlyInstallment'],
            'chitFrequency' => $scheme['chitFrequency'],
            'chitType' => $scheme['chitType'],
            'startDate' => $scheme['startDate'],
            'endDate' => $scheme['endDate'],
            'schemeStatus' => $scheme['schemeStatus'],
            'schedule' => $schedule
        ];
    }
    
    sendResponse(true, [
        'customer' => $customer,
        'schemes' => $schemesWithPayments,
        'totalSchemes' => count($schemesWithPayments)
    ]);
    
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
} catch(Exception $e) {
    sendResponse(false, null, 'Error: ' . $e->getMessage(), 500);
}

