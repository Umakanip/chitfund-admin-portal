# Chit Schedule Feature Guide

## Overview
The **Chit Schedule** tab displays the monthly allocation schedule for each chit scheme. It shows which customer is allocated/winner for each month (1-24 months based on scheme duration).

## Tab Name
**"Chit Schedule"** - Located in the sidebar navigation with a 📅 icon

## Features

### 1. **Schedule Display**
- Shows all months (1 to duration) for the selected chit scheme
- Displays customer details for each month:
  - Customer Name
  - Phone Number
  - Email
  - Allocation Type (Fixed/Auction/Pending)
  - Allocation Date
  - Amount Received
  - Status (Pending/Allocated/Completed/Cancelled)

### 2. **Scheme Selection**
- Dropdown to select an active chit scheme
- Shows scheme name and duration
- Automatically loads schedule when scheme is selected

### 3. **Generate Schedule**
- Button to generate schedule rows for all months
- Creates one row per month (e.g., 24 rows for 24-month scheme)
- Can only be generated once per scheme

### 4. **Allocation Types**
- **Fixed**: Predetermined allocation (for fixed chit type)
- **Auction**: Winner determined by auction (for auction chit type)
- **Pending**: Not yet allocated

## Database Structure

### `chit_schedules` Table
```sql
- id: Primary key
- scheme_id: Foreign key to chit_schemes
- month_number: Month number (1, 2, 3, ..., duration)
- customer_id: Foreign key to customers (NULL if not allocated)
- allocation_type: 'auction', 'fixed', or 'pending'
- allocation_date: Date when customer was allocated
- status: 'pending', 'allocated', 'completed', 'cancelled'
- amount_received: Amount received by customer
- created_at, updated_at: Timestamps
```

## Backend API Endpoints

### 1. Get Schedules
- **GET** `/api/schedules/index.php?schemeId={id}`
- Returns schedule for specific scheme or all schemes

### 2. Generate Schedule
- **POST** `/api/schedules/generate.php`
- Body: `{ "schemeId": "1" }`
- Creates schedule rows for all months

### 3. Allocate Customer
- **POST** `/api/schedules/allocate.php`
- Body: `{ "schemeId": "1", "customerId": "5", "allocationDate": "2024-01-15", "amountReceived": 95000 }`
- Assigns customer to a specific month

## Usage Flow

1. **Select Scheme**: Choose a chit scheme from dropdown
2. **Generate Schedule**: Click "Generate Schedule" button (first time only)
3. **View Schedule**: See all months with customer allocations
4. **Allocate Customers**: (Future feature) Assign customers to specific months

## For Fixed Chit Type
- Allocation type is set to 'fixed' when schedule is generated
- Customers can be pre-assigned to months
- Amount received is predetermined

## For Auction Chit Type
- Allocation type starts as 'pending'
- Changes to 'auction' when customer is allocated
- Amount received is based on auction bid
- Winner is determined through auction process

## Migration

Run the migration script to create the table:
```bash
cd backend
php migrate_add_chit_schedules_table.php
```

## Example Display

For a 24-month scheme:
- Month 1: Customer A (Allocated, Auction, ₹95,000)
- Month 2: Customer B (Allocated, Auction, ₹92,000)
- Month 3: Not Allocated (Pending)
- ...
- Month 24: Not Allocated (Pending)

## Future Enhancements
- Edit/Update allocation
- Bulk allocation
- Export schedule to PDF/Excel
- Filter by status
- Search functionality

