# Quick Start Guide

## Fixing Database Connection Issues

If you see errors like:
- `Access denied for user 'root'@'localhost'`
- `Undefined index: REQUEST_METHOD`

### Step 1: Configure MySQL Credentials

Edit `backend/config/init_database.php` and update the `$db_config` array:

```php
$db_config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => 'YOUR_MYSQL_PASSWORD',  // ← Update this
    'db_name' => 'chitfund_db'
];
```

Also update `backend/config/database.php`:

```php
private $username = "root";
private $password = "YOUR_MYSQL_PASSWORD";  // ← Update this
```

### Step 2: Ensure MySQL is Running

**Windows (XAMPP/WAMP):**
- Start MySQL service from XAMPP/WAMP control panel

**Linux/Mac:**
```bash
sudo service mysql start
# or
sudo systemctl start mysql
```

### Step 3: Run Initialization

```bash
cd backend
php config/init_database.php
```

### Common Issues

**Issue: "Access denied"**
- Solution: Check MySQL username/password
- Default XAMPP: username=`root`, password=`` (empty)
- Default WAMP: username=`root`, password=`` (empty)

**Issue: "MySQL server not running"**
- Solution: Start MySQL service

**Issue: "Can't connect to MySQL"**
- Solution: Check if MySQL is running on port 3306
- Try: `mysql -u root -p` to test connection

### Testing MySQL Connection

```bash
mysql -u root -p
# Enter password (or press Enter if no password)
```

If this works, use the same credentials in the config files.

