# Migration Guide: Moving Frontend to Frontend Folder

## Steps to Migrate

1. **Create frontend folder structure**
2. **Move all frontend files to frontend folder**
3. **Update paths in configuration files**

## Files to Move

Move these files/folders from root to `frontend/`:
- `src/` → `frontend/src/`
- `index.html` → `frontend/index.html`
- `package.json` → `frontend/package.json`
- `package-lock.json` → `frontend/package-lock.json`
- `tsconfig.json` → `frontend/tsconfig.json`
- `tsconfig.node.json` → `frontend/tsconfig.node.json`
- `vite.config.ts` → `frontend/vite.config.ts`
- `node_modules/` → `frontend/node_modules/` (or reinstall)

## After Migration

1. Update `frontend/src/services/mockApi.ts` to use `apiService` from `api.ts`
2. Install dependencies in frontend folder:
   ```bash
   cd frontend
   npm install
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```

## Backend Setup

1. Initialize database:
   ```bash
   cd backend
   php config/init_database.php
   ```
2. Start PHP server:
   ```bash
   php -S localhost:8000 -t backend
   ```

