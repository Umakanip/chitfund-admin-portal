# Chit Fund Admin Portal - Backend (PHP)

## Setup Instructions

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server

### Installation Steps

1. **Configure Database**
   - Open `config/database.php`
   - Update database credentials:
     ```php
     private $host = "localhost";
     private $db_name = "chitfund_db";
     private $username = "root";
     private $password = "";
     ```

2. **Initialize Database**
   - Run the initialization script:
     ```bash
     php config/init_database.php
     ```
   - This will create the database and tables with sample data

3. **Configure Web Server**
   - Point your web server document root to the `backend` folder
   - Or use PHP built-in server:
     ```bash
     php -S localhost:8000 -t backend
     ```

4. **Update Frontend API URL**
   - Open `frontend/src/services/api.ts`
   - Update `API_BASE_URL` to match your backend URL:
     ```typescript
     const API_BASE_URL = 'http://localhost:8000/api';
     ```

### API Endpoints

#### Authentication
- `POST /api/auth/login.php` - User login
- `POST /api/auth/register.php` - User registration
- `GET /api/auth/logout.php` - User logout

#### Customers
- `GET /api/customers/index.php` - Get all customers
- `GET /api/customers/get.php?id={id}` - Get customer by ID
- `POST /api/customers/index.php` - Add new customer
- `PUT /api/customers/update.php?id={id}` - Update customer
- `DELETE /api/customers/delete.php?id={id}` - Delete customer

#### Chit Schemes
- `GET /api/schemes/index.php` - Get all schemes
- `GET /api/schemes/get.php?id={id}` - Get scheme by ID
- `POST /api/schemes/index.php` - Create new scheme
- `PUT /api/schemes/update.php?id={id}` - Update scheme
- `DELETE /api/schemes/delete.php?id={id}` - Delete scheme

#### Payments
- `GET /api/payments/index.php` - Get all payments

#### Auctions
- `GET /api/auctions/index.php` - Get all auctions

### Default Credentials
- Username: `admin`
- Password: `password`

### Database Schema
The database includes the following tables:
- `users` - User accounts
- `customers` - Customer information
- `chit_schemes` - Chit fund schemes
- `payments` - Payment records
- `auctions` - Auction records

