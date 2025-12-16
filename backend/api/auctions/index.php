<?php
require_once '../../config/database.php';

$db = new Database();
$conn = $db->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $stmt = $conn->query("SELECT a.id, a.scheme_id as schemeId, s.name as schemeName, a.auction_date as auctionDate, 
                          a.base_amount as baseAmount, a.highest_bid as highestBid, a.winner_id as winnerId, 
                          c.name as winnerName, a.status 
                          FROM auctions a 
                          LEFT JOIN chit_schemes s ON a.scheme_id = s.id 
                          LEFT JOIN customers c ON a.winner_id = c.id 
                          ORDER BY a.id DESC");
    $auctions = $stmt->fetchAll();
    
    foreach ($auctions as &$auction) {
        $auction['id'] = (string)$auction['id'];
        $auction['schemeId'] = (string)$auction['schemeId'];
        $auction['baseAmount'] = (float)$auction['baseAmount'];
        $auction['highestBid'] = (float)$auction['highestBid'];
        $auction['winnerId'] = $auction['winnerId'] ? (string)$auction['winnerId'] : null;
    }
    
    sendResponse(true, $auctions);
} catch(PDOException $e) {
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}

