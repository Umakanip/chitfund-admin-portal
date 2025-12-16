# Setup Instructions - Chit Fund Admin Portal

## Project Structure

```
ChitfundAdminportal/
├── frontend/          # React frontend application
├── backend/           # PHP backend API
└── [other files]
```

## Step 1: Move Frontend Files

**Option A: Manual Move (Recommended)**
1. Create `frontend` folder in project root
2. Move these files/folders to `frontend/`:
   - `src/` → `frontend/src/`
   - `index.html` → `frontend/index.html`
   - `package.json` → `frontend/package.json`
   - `package-lock.json` → `frontend/package-lock.json`
   - `tsconfig.json` → `frontend/tsconfig.json`
   - `tsconfig.node.json` → `frontend/tsconfig.node.json`
   - `vite.config.ts` → `frontend/vite.config.ts`

**Option B: Use Batch Script (Windows)**
Run `move_frontend.bat` in the project root

## Step 2: Backend Setup

### 2.1 Configure Database
Edit `backend/config/database.php`:
```php
private $host = "localhost";
private $db_name = "chitfund_db";
private $username = "root";      // Your MySQL username
private $password = "";          // Your MySQL password
```

### 2.2 Initialize Database
```bash
cd backend
php config/init_database.php
```

This will:
- Create the database `chitfund_db`
- Create all required tables
- Insert default admin user and sample data

### 2.3 Start PHP Server

**Option A: PHP Built-in Server**
```bash
cd backend
php -S localhost:8000
```

**Option B: XAMPP/WAMP**
1. Copy `backend` folder to `htdocs` or `www`
2. Access via: `http://localhost/backend/api/...`

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Configure API URL

Edit `frontend/src/services/api.ts`:
```typescript
// For PHP built-in server:
const API_BASE_URL = 'http://localhost:8000/api';

// For XAMPP/WAMP:
const API_BASE_URL = 'http://localhost/chitfund-admin-portal/backend/api';
```

Or create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000/api
```

### 3.3 Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:3000`

## Step 4: Verify Setup

1. **Backend**: Visit `http://localhost:8000/api/customers/index.php`
   - Should return JSON with customers

2. **Frontend**: Visit `http://localhost:3000`
   - Login with: `admin` / `password`

## Troubleshooting

### CORS Issues
- Backend already includes CORS headers
- If issues persist, check browser console

### Database Connection Error
- Verify MySQL is running
- Check credentials in `backend/config/database.php`
- Ensure database exists (run init script)

### API Not Found
- Verify PHP server is running
- Check API URL in `frontend/src/services/api.ts`
- Test API endpoint directly in browser

### Frontend Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version (v16+)

## Default Credentials

- **Username**: `admin`
- **Password**: `password`

## API Endpoints

All endpoints return JSON:
- `POST /api/auth/login.php` - Login
- `POST /api/auth/register.php` - Register
- `GET /api/customers/index.php` - Get customers
- `POST /api/customers/index.php` - Add customer
- `PUT /api/customers/update.php?id={id}` - Update customer
- `DELETE /api/customers/delete.php?id={id}` - Delete customer
- Similar endpoints for schemes, payments, auctions

