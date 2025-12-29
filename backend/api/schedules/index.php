<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $schemeId = $_GET['schemeId'] ?? null;
    
    try {
        if ($schemeId) {
            // Get schedule for a specific scheme
            $stmt = $conn->prepare("SELECT s.id, s.scheme_id, s.month_number, s.customer_id, s.allocation_type, 
                                   s.allocation_date, s.status, s.amount_received,
                                   c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
                                   ch.name as schemeName, ch.duration, ch.total_amount, ch.chit_type, ch.chit_frequency
                                   FROM chit_schedules s
                                   LEFT JOIN customers c ON s.customer_id = c.id
                                   LEFT JOIN chit_schemes ch ON s.scheme_id = ch.id
                                   WHERE s.scheme_id = ?
                                   ORDER BY s.month_number ASC");
            $stmt->execute([$schemeId]);
            $schedules = $stmt->fetchAll();
            
            foreach ($schedules as &$schedule) {
                $schedule['id'] = (string)$schedule['id'];
                $schedule['schemeId'] = (string)$schedule['scheme_id'];
                $schedule['monthNumber'] = (int)$schedule['month_number'];
                $schedule['customerId'] = $schedule['customer_id'] ? (string)$schedule['customer_id'] : '';
                $schedule['allocationType'] = $schedule['allocation_type'];
                $schedule['allocationDate'] = $schedule['allocation_date'] ?: '';
                $schedule['amountReceived'] = $schedule['amount_received'] ? (float)$schedule['amount_received'] : null;
            }
            
            sendResponse(true, $schedules);
        } else {
            // Get all schedules grouped by scheme
            $stmt = $conn->query("SELECT s.id, s.scheme_id, s.month_number, s.customer_id, s.allocation_type, 
                                s.allocation_date, s.status, s.amount_received,
                                c.name as customerName, c.email as customerEmail, c.phone as customerPhone,
                                ch.name as schemeName, ch.duration, ch.total_amount, ch.chit_type, ch.chit_frequency
                                FROM chit_schedules s
                                LEFT JOIN customers c ON s.customer_id = c.id
                                LEFT JOIN chit_schemes ch ON s.scheme_id = ch.id
                                ORDER BY ch.id ASC, s.month_number ASC");
            $schedules = $stmt->fetchAll();
            
            // Group by scheme
            $grouped = [];
            foreach ($schedules as $schedule) {
                $schemeId = $schedule['scheme_id'];
                if (!isset($grouped[$schemeId])) {
                    $grouped[$schemeId] = [
                        'schemeId' => (string)$schemeId,
                        'schemeName' => $schedule['schemeName'],
                        'duration' => (int)$schedule['duration'],
                        'totalAmount' => (float)$schedule['total_amount'],
                        'chitType' => $schedule['chit_type'],
                        'chitFrequency' => $schedule['chit_frequency'],
                        'schedules' => []
                    ];
                }
                
                $grouped[$schemeId]['schedules'][] = [
                    'id' => (string)$schedule['id'],
                    'monthNumber' => (int)$schedule['month_number'],
                    'customerId' => $schedule['customer_id'] ? (string)$schedule['customer_id'] : '',
                    'customerName' => $schedule['customerName'] ?: 'Not Allocated',
                    'customerEmail' => $schedule['customerEmail'] ?: '',
                    'customerPhone' => $schedule['customerPhone'] ?: '',
                    'allocationType' => $schedule['allocation_type'],
                    'allocationDate' => $schedule['allocation_date'] ?: '',
                    'status' => $schedule['status'],
                    'amountReceived' => $schedule['amount_received'] ? (float)$schedule['amount_received'] : null
                ];
            }
            
            sendResponse(true, array_values($grouped));
        }
    } catch(PDOException $e) {
        $errorMessage = $e->getMessage();
        // Check if table doesn't exist
        if (strpos($errorMessage, "doesn't exist") !== false || strpos($errorMessage, "Unknown table") !== false) {
            sendResponse(false, null, 'Chit schedules table does not exist. Please run the migration script: php backend/migrate_add_chit_schedules_table.php', 500);
        } else {
            sendResponse(false, null, 'Database error: ' . $errorMessage, 500);
        }
    }
} else {
    sendResponse(false, null, 'Method not allowed', 405);
}

