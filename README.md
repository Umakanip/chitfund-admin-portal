# Chit Fund Admin Portal

A full-stack web application for managing Chit Fund operations with React frontend and PHP backend.

## Project Structure

```
ChitfundAdminportal/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # PHP REST API
│   ├── api/           # API endpoints
│   ├── config/        # Database configuration
│   └── README.md
└── SETUP_INSTRUCTIONS.md
```

## Quick Start

### Prerequisites
- Node.js (v16+)
- PHP 7.4+
- MySQL 5.7+

### Backend Setup

1. **Configure Database**
   ```bash
   # Edit backend/config/database.php
   # Update MySQL credentials
   ```

2. **Initialize Database**
   ```bash
   cd backend
   php config/init_database.php
   ```

3. **Start PHP Server**
   ```bash
   php -S localhost:8000 -t backend
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API URL**
   ```bash
   # Edit frontend/src/services/api.ts
   # Update API_BASE_URL if needed
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api

## Default Credentials

- **Username**: `admin`
- **Password**: `password`

## Features

- ✅ User Authentication (Login/Register)
- ✅ Customer Management (CRUD)
- ✅ Chit Scheme Management (CRUD)
- ✅ Payment Tracking
- ✅ Auction Management
- ✅ Responsive Sidebar Navigation
- ✅ Pagination
- ✅ Search & Filter

## API Endpoints

### Authentication
- `POST /api/auth/login.php`
- `POST /api/auth/register.php`
- `GET /api/auth/logout.php`

### Customers
- `GET /api/customers/index.php`
- `GET /api/customers/get.php?id={id}`
- `POST /api/customers/index.php`
- `PUT /api/customers/update.php?id={id}`
- `DELETE /api/customers/delete.php?id={id}`

### Schemes
- `GET /api/schemes/index.php`
- `GET /api/schemes/get.php?id={id}`
- `POST /api/schemes/index.php`
- `PUT /api/schemes/update.php?id={id}`
- `DELETE /api/schemes/delete.php?id={id}`

### Payments & Auctions
- `GET /api/payments/index.php`
- `GET /api/auctions/index.php`

## Technology Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router DOM
- Axios

**Backend:**
- PHP 7.4+
- MySQL
- PDO

## Development

See `SETUP_INSTRUCTIONS.md` for detailed setup instructions.

## License

MIT
