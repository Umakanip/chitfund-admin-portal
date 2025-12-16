# Chit Type Fields Addition Guide

## Overview
Two new fields have been added to the Chit Scheme system:
1. **Chit Frequency** - Week/Month (payment frequency)
2. **Chit Type** - Fixed/Auction (bidding method)

## Changes Made

### 1. Database Schema
- Added `chit_frequency` ENUM('week', 'month') column to `chit_schemes` table
- Added `chit_type` ENUM('fixed', 'auction') column to `chit_schemes` table
- Both fields have default values ('month' and 'auction' respectively)

### 2. Backend API Updates
- **`backend/api/schemes/index.php`**: Updated GET and POST endpoints to include new fields
- **`backend/api/schemes/get.php`**: Updated to fetch new fields
- **`backend/api/schemes/update.php`**: Updated to handle new fields in updates

### 3. Frontend Updates
- **`frontend/src/types/index.ts`**: Added `chitFrequency` and `chitType` to `ChitScheme` interface
- **`frontend/src/pages/AddScheme.tsx`**: Added form fields for both new fields
- **`frontend/src/pages/EditScheme.tsx`**: Added form fields and update logic
- **`frontend/src/pages/SchemeList.tsx`**: Display new fields in scheme cards

### 4. Migration Script
Created `backend/migrate_add_chit_type_fields.php` to add columns to existing databases.

## Running the Migration

If you have an existing database, run the migration script:

```bash
cd backend
php migrate_add_chit_type_fields.php
```

Or from the project root:
```bash
php backend/migrate_add_chit_type_fields.php
```

The script will:
- Check if columns already exist
- Add `chit_frequency` column if missing
- Add `chit_type` column if missing
- Set default values for existing records

## Field Descriptions

### Chit Frequency
- **Week**: Payments are collected weekly
- **Month**: Payments are collected monthly (default)

### Chit Type
- **Fixed**: Fixed payout amount (no bidding)
- **Auction**: Auction-based bidding system (default)

## Form Layout

The form now displays fields in a 3-column grid:
- **Row 1**: Scheme Name (full width)
- **Row 2**: Total Amount, Duration, Monthly Installment
- **Row 3**: Start Date, End Date, Chit Frequency
- **Row 4**: Chit Type, Total Members, Current Members
- **Row 5**: Status

## Display in Scheme List

The scheme cards now show:
- Chit Frequency: Week or Month
- Chit Type: Fixed or Auction

## Testing

1. Create a new scheme and verify both fields are saved
2. Edit an existing scheme and verify fields can be updated
3. Check the scheme list to see the new fields displayed
4. Verify existing schemes show default values (Month/Auction)

## Notes

- Existing schemes will have default values: `month` for frequency and `auction` for type
- The migration script is safe to run multiple times (it checks for existing columns)
- All API endpoints now return and accept these new fields

