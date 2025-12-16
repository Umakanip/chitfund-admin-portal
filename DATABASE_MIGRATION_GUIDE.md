# Database Migration Guide - Add City and WhatsApp Number

## Overview

This guide will help you add **City** and **WhatsApp Number** fields to your existing customers table.

## Step 1: Run Migration Script

### Option 1: Using Migration Script (Recommended)

```powershell
cd D:\ChitfundAdminportal\backend
php migrate_add_customer_fields.php
```

This script will:
- ✅ Check if columns already exist
- ✅ Add `city` column (VARCHAR(100))
- ✅ Add `whatsapp_number` column (VARCHAR(20))
- ✅ Show success message

### Option 2: Manual SQL (Using MySQL Workbench)

1. **Open MySQL Workbench**
2. **Connect to your database** (`chitfund_db`)
3. **Run these SQL commands:**

```sql
-- Add city column
ALTER TABLE customers 
ADD COLUMN city VARCHAR(100) AFTER address;

-- Add whatsapp_number column
ALTER TABLE customers 
ADD COLUMN whatsapp_number VARCHAR(20) AFTER phone;
```

## Step 2: Verify Columns Added

### In MySQL Workbench:

```sql
-- Check table structure
DESCRIBE customers;

-- Or
SHOW COLUMNS FROM customers;
```

You should see:
- `whatsapp_number` (after `phone`)
- `city` (after `address`)

## Step 3: Test the Changes

### 1. **Frontend Test:**
- Go to: `http://localhost:3000/customers/add`
- You should see new fields:
  - **WhatsApp Number** (optional)
  - **City** (optional)
  - **Address** (required, full width)

### 2. **Add a Customer:**
- Fill in all fields including WhatsApp and City
- Submit the form
- Customer should be saved successfully

### 3. **Edit a Customer:**
- Click edit on any customer
- You should see WhatsApp and City fields
- Update and save

### 4. **Verify in Database:**
```sql
SELECT id, name, phone, whatsapp_number, address, city 
FROM customers;
```

## Database Schema Changes

### Before:
```sql
customers (
    id, name, email, phone, address, aadhar_number, pan_number, status, created_at
)
```

### After:
```sql
customers (
    id, name, email, phone, whatsapp_number, address, city, 
    aadhar_number, pan_number, status, created_at
)
```

## Field Details

### WhatsApp Number
- **Type:** VARCHAR(20)
- **Required:** No (optional)
- **Format:** 10-digit phone number
- **Validation:** Pattern `[0-9]{10}`

### City
- **Type:** VARCHAR(100)
- **Required:** No (optional)
- **Example:** Mumbai, Delhi, Bangalore

### Address
- **Type:** TEXT
- **Required:** Yes
- **Note:** Already existed, now displayed with City field

## Updated Files

### Backend:
- ✅ `backend/config/init_database.php` - Updated table schema
- ✅ `backend/api/customers/index.php` - Updated GET and POST
- ✅ `backend/api/customers/get.php` - Updated SELECT query
- ✅ `backend/api/customers/update.php` - Updated UPDATE query
- ✅ `backend/migrate_add_customer_fields.php` - Migration script

### Frontend:
- ✅ `frontend/src/types/index.ts` - Added fields to Customer interface
- ✅ `frontend/src/pages/AddCustomer.tsx` - Added form fields
- ✅ `frontend/src/pages/EditCustomer.tsx` - Added form fields

## Form Layout

### New Layout (3 fields per row):

**Row 1:**
- Full Name | Email | Phone Number

**Row 2:**
- WhatsApp Number | City | (empty)

**Row 3:**
- Address (full width)

**Row 4:**
- Aadhar Number | PAN Number | Status

## Troubleshooting

### Issue: "Column already exists"
**Solution:** The migration script checks for this. If you see this, columns are already added.

### Issue: "Unknown column 'city'"
**Solution:** Run the migration script or add columns manually via SQL.

### Issue: Fields not showing in frontend
**Solution:**
1. Restart frontend server: `npm run dev`
2. Clear browser cache
3. Check browser console for errors

### Issue: Data not saving
**Solution:**
1. Check backend API is running
2. Check database columns exist
3. Check browser console for API errors

## Rollback (If Needed)

If you need to remove these columns:

```sql
ALTER TABLE customers DROP COLUMN city;
ALTER TABLE customers DROP COLUMN whatsapp_number;
```

**Warning:** This will delete all city and WhatsApp data!

## Summary

✅ **Database:** Columns added via migration script
✅ **Backend:** All API endpoints updated
✅ **Frontend:** Forms updated with new fields
✅ **Layout:** 3 fields per row, organized layout

**The new fields are now ready to use!** 🎉

