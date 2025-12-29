<?php
require_once 'database.php';

// Configuration - Update these values to match your MySQL setup
$db_config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => 'root',  // MySQL password
    'db_name' => 'chitfund_db'
];

echo "Initializing database...\n";
echo "Using MySQL host: {$db_config['host']}\n";
echo "Using MySQL user: {$db_config['username']}\n\n";

// First, connect without database to create it
try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']}",
        $db_config['username'],
        $db_config['password']
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS {$db_config['db_name']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Database '{$db_config['db_name']}' created/verified successfully!\n\n";
} catch(PDOException $e) {
    echo "ERROR: Failed to connect to MySQL server.\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    echo "Please check:\n";
    echo "1. MySQL server is running\n";
    echo "2. Username and password in init_database.php are correct\n";
    echo "3. MySQL user has CREATE DATABASE privileges\n\n";
    echo "To fix: Edit backend/config/init_database.php and update the \$db_config array.\n";
    die();
}

// Now connect to the database
// Note: Make sure database.php has the same credentials
$db = new Database();
$conn = $db->getConnection();

if (!$conn) {
    echo "WARNING: Failed to connect to database '{$db_config['db_name']}'\n";
    echo "Attempting to reconnect...\n\n";
    
    // Try connecting directly
    try {
        $conn = new PDO(
            "mysql:host={$db_config['host']};dbname={$db_config['db_name']};charset=utf8mb4",
            $db_config['username'],
            $db_config['password']
        );
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        echo "✓ Connected to database successfully!\n\n";
    } catch(PDOException $e) {
        die("ERROR: " . $e->getMessage() . "\n");
    }
} else {
    echo "✓ Connected to database successfully!\n\n";
}

// Create tables
try {
    // Users table
    $conn->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'manager') DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Customers table
    $conn->exec("CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        whatsapp_number VARCHAR(20),
        address TEXT NOT NULL,
        city VARCHAR(100),
        aadhar_number VARCHAR(20) NOT NULL,
        pan_number VARCHAR(20) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at DATE DEFAULT (CURRENT_DATE)
    )");

    // Chit Schemes table
    $conn->exec("CREATE TABLE IF NOT EXISTS chit_schemes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        duration INT NOT NULL,
        monthly_installment DECIMAL(15, 2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        chit_frequency ENUM('week', 'month') DEFAULT 'month',
        chit_type ENUM('fixed', 'auction') DEFAULT 'auction',
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        total_members INT NOT NULL,
        current_members INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Customer Schemes (Junction table - links customers to chit schemes)
    // Note: No unique constraint - customers can join the same scheme multiple times
    $conn->exec("CREATE TABLE IF NOT EXISTS customer_schemes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        scheme_id INT NOT NULL,
        joined_date DATE DEFAULT (CURRENT_DATE),
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE
    )");

    // Chit Schedules table - Monthly allocation schedule for each chit scheme
    $conn->exec("CREATE TABLE IF NOT EXISTS chit_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        scheme_id INT NOT NULL,
        month_number INT NOT NULL,
        customer_id INT NULL,
        allocation_type ENUM('auction', 'fixed', 'pending') DEFAULT 'pending',
        allocation_date DATE NULL,
        status ENUM('pending', 'allocated', 'completed', 'cancelled') DEFAULT 'pending',
        amount_received DECIMAL(15, 2) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        UNIQUE KEY unique_scheme_month (scheme_id, month_number)
    )");

    // Payments table
    $conn->exec("CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        scheme_id INT NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        payment_date DATE,
        month INT NOT NULL,
        status ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE
    )");

    // Auctions table
    $conn->exec("CREATE TABLE IF NOT EXISTS auctions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        scheme_id INT NOT NULL,
        auction_date DATE NOT NULL,
        base_amount DECIMAL(15, 2) NOT NULL,
        highest_bid DECIMAL(15, 2) DEFAULT 0,
        winner_id INT,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES customers(id) ON DELETE SET NULL
    )");

    // Insert default admin user
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $password = password_hash('password', PASSWORD_DEFAULT);
        $conn->exec("INSERT INTO users (username, email, password, name, role) 
                    VALUES ('admin', 'admin@chitfund.com', '$password', 'Admin User', 'admin')");
    }

    // Insert Umakani user
    $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = 'Umakani'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $password = password_hash('test', PASSWORD_DEFAULT);
        $conn->exec("INSERT INTO users (username, email, password, name, role) 
                    VALUES ('Umakani', 'uma@gmail.com', '$password', 'Umakani', 'manager')");
    }

    // Insert default customers
    $stmt = $conn->prepare("SELECT COUNT(*) FROM customers");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO customers (name, email, phone, whatsapp_number, address, city, aadhar_number, pan_number, status, created_at) VALUES
            ('Rajesh Kumar', 'rajesh@example.com', '9876543210', '9876543210', '123 Main Street', 'Mumbai', '1234-5678-9012', 'ABCDE1234F', 'active', '2024-01-15'),
            ('Priya Sharma', 'priya@example.com', '9876543211', '9876543211', '456 Park Avenue', 'Delhi', '2345-6789-0123', 'FGHIJ5678K', 'active', '2024-01-20'),
            ('Amit Patel', 'amit@example.com', '9876543212', '9876543212', '789 Market Road', 'Bangalore', '3456-7890-1234', 'LMNOP9012Q', 'active', '2024-02-01')");
    }

    // Insert default schemes
    $stmt = $conn->prepare("SELECT COUNT(*) FROM chit_schemes");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $conn->exec("INSERT INTO chit_schemes (name, total_amount, duration, monthly_installment, start_date, end_date, chit_frequency, chit_type, status, total_members, current_members) VALUES
            ('Monthly Chit Scheme - 1 Lakh', 100000, 12, 8333, '2024-01-01', '2024-12-31', 'month', 'auction', 'active', 20, 15),
            ('Monthly Chit Scheme - 5 Lakh', 500000, 24, 20833, '2024-01-01', '2025-12-31', 'month', 'fixed', 'active', 25, 20),
            ('Monthly Chit Scheme - 2 Lakh', 200000, 12, 16666, '2023-06-01', '2024-05-31', 'month', 'auction', 'completed', 15, 15)");
    }

    // Insert default auctions
    $stmt = $conn->prepare("SELECT COUNT(*) FROM auctions");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        // Get scheme IDs (assuming they exist or were just created)
        $schemeStmt = $conn->query("SELECT id FROM chit_schemes ORDER BY id LIMIT 3");
        $schemes = $schemeStmt->fetchAll();
        
        // Get customer IDs
        $customerStmt = $conn->query("SELECT id FROM customers ORDER BY id LIMIT 3");
        $customers = $customerStmt->fetchAll();
        
        if (count($schemes) > 0 && count($customers) > 0) {
            $scheme1Id = $schemes[0]['id'];
            $scheme2Id = count($schemes) > 1 ? $schemes[1]['id'] : $schemes[0]['id'];
            $customer1Id = $customers[0]['id'];
            $customer2Id = count($customers) > 1 ? $customers[1]['id'] : $customers[0]['id'];
            $customer3Id = count($customers) > 2 ? $customers[2]['id'] : $customers[0]['id'];
            
            $conn->exec("INSERT INTO auctions (scheme_id, auction_date, base_amount, highest_bid, winner_id, status) VALUES
                ($scheme1Id, '2024-02-15', 100000, 95000, $customer1Id, 'completed'),
                ($scheme1Id, '2024-03-15', 100000, 0, NULL, 'scheduled'),
                ($scheme2Id, '2024-02-20', 500000, 480000, $customer2Id, 'completed')");
        }
    }

    // Insert default payments
    $stmt = $conn->prepare("SELECT COUNT(*) FROM payments");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        // Get scheme IDs and their monthly installments
        $schemeStmt = $conn->query("SELECT id, monthly_installment FROM chit_schemes ORDER BY id LIMIT 3");
        $schemes = $schemeStmt->fetchAll();
        
        // Get customer IDs
        $customerStmt = $conn->query("SELECT id FROM customers ORDER BY id LIMIT 3");
        $customers = $customerStmt->fetchAll();
        
        if (count($schemes) > 0 && count($customers) > 0) {
            $scheme1Id = $schemes[0]['id'];
            $scheme1Installment = (float)$schemes[0]['monthly_installment'];
            $scheme2Id = count($schemes) > 1 ? $schemes[1]['id'] : $schemes[0]['id'];
            $scheme2Installment = count($schemes) > 1 ? (float)$schemes[1]['monthly_installment'] : (float)$schemes[0]['monthly_installment'];
            
            $customer1Id = $customers[0]['id'];
            $customer2Id = count($customers) > 1 ? $customers[1]['id'] : $customers[0]['id'];
            $customer3Id = count($customers) > 2 ? $customers[2]['id'] : $customers[0]['id'];
            
            // Insert sample payments
            $conn->exec("INSERT INTO payments (customer_id, scheme_id, amount, payment_date, month, status) VALUES
                ($customer1Id, $scheme1Id, $scheme1Installment, '2024-01-05', 1, 'paid'),
                ($customer2Id, $scheme1Id, $scheme1Installment, '2024-01-06', 1, 'paid'),
                ($customer1Id, $scheme1Id, $scheme1Installment, '2024-02-05', 2, 'paid'),
                ($customer2Id, $scheme1Id, $scheme1Installment, '2024-02-07', 2, 'paid'),
                ($customer3Id, $scheme1Id, $scheme1Installment, NULL, 2, 'pending'),
                ($customer1Id, $scheme1Id, $scheme1Installment, NULL, 3, 'pending'),
                ($customer2Id, $scheme2Id, $scheme2Installment, '2024-01-10', 1, 'paid'),
                ($customer3Id, $scheme2Id, $scheme2Installment, NULL, 1, 'overdue')");
        }
    }

    echo "Database initialized successfully!\n";
} catch(PDOException $e) {
    die("Error creating tables: " . $e->getMessage());
}

