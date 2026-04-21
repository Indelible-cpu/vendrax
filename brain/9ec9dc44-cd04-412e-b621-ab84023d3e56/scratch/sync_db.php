<?php
require_once __DIR__ . '/api/src/Config/Database.php';

use App\Config\Database;

$database = new Database();
$db = $database->getConnection();

function addColumnIfNotExists($db, $table, $column, $type) {
    try {
        $stmt = $db->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        if ($stmt->rowCount() == 0) {
            echo "Adding column '$column' to '$table'...\n";
            $db->exec("ALTER TABLE `$table` ADD `$column` $type");
        } else {
            echo "Column '$column' already exists in '$table'.\n";
        }
    } catch (Exception $e) {
        echo "Error on $table.$column: " . $e->getMessage() . "\n";
    }
}

// 1. Products Table
addColumnIfNotExists($db, 'products', 'tax_rate', 'DECIMAL(5,2) DEFAULT 0');

// 2. Transactions Table
addColumnIfNotExists($db, 'transactions', 'tax_rate', 'DECIMAL(5,2) DEFAULT 0');
addColumnIfNotExists($db, 'transactions', 'tax_amount', 'DECIMAL(10,2) DEFAULT 0');
addColumnIfNotExists($db, 'transactions', 'customer_id', 'INT NULL');
addColumnIfNotExists($db, 'transactions', 'is_credit', 'TINYINT(1) DEFAULT 0');
addColumnIfNotExists($db, 'transactions', 'due_date', 'DATE NULL');
addColumnIfNotExists($db, 'transactions', 'deleted', 'TINYINT(1) DEFAULT 0');

// 3. Customers table (might be missing)
try {
    $db->exec("CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NULL,
        id_number VARCHAR(50) NULL,
        village VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    echo "Customers table verified.\n";
} catch (Exception $e) {
    echo "Error creating customers table: " . $e->getMessage() . "\n";
}

echo "DB Sync complete.\n";
