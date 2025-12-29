# Customer to Scheme Assignment - Architecture Overview

This document explains how customer-to-scheme assignment works throughout the Chit Fund Admin Portal project.

## Overview

The system allows assigning customers (members) to chit schemes. A customer can be assigned to multiple schemes, and a scheme can have multiple customers. This is a many-to-many relationship managed through a junction table.

## Architecture Flow

### 1. Database Layer

**Table: `customer_schemes`** (Junction Table)
- **Location**: `backend/config/init_database.php` (lines 112-121)
- **Purpose**: Links customers to chit schemes
- **Structure**:
  ```sql
  CREATE TABLE customer_schemes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      scheme_id INT NOT NULL,
      joined_date DATE DEFAULT (CURRENT_DATE),
      status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (scheme_id) REFERENCES chit_schemes(id) ON DELETE CASCADE
  )
  ```

**Key Points**:
- No unique constraint - customers can join the same scheme multiple times
- Status field tracks membership state (active/completed/cancelled)
- `current_members` in `chit_schemes` table is updated when members are added

---

### 2. Backend API Layer

#### A. Add Customers to Scheme
**File**: `backend/api/schemes/add_customers.php`
- **Endpoint**: `POST /api/schemes/add_customers.php`
- **Functionality**:
  - Accepts `schemeId` and array of `customerIds`
  - Validates scheme exists and has available slots
  - Checks if customers already exist in the scheme
  - Inserts records into `customer_schemes` table
  - Updates `current_members` count in `chit_schemes` table
  - Uses database transactions for data integrity
  - Returns count of added/skipped customers

**Key Logic**:
```php
// Check available slots
$availableSlots = $scheme['total_members'] - $scheme['current_members'];

// Check existing memberships
$memberCountStmt = $conn->prepare("SELECT COUNT(*) FROM customer_schemes 
    WHERE customer_id = ? AND scheme_id = ? AND status = 'active'");

// Insert membership
$linkStmt = $conn->prepare("INSERT INTO customer_schemes 
    (customer_id, scheme_id, status) VALUES (?, ?, 'active')");

// Update scheme member count
$updateStmt = $conn->prepare("UPDATE chit_schemes 
    SET current_members = current_members + 1 WHERE id = ?");
```

#### B. Get Scheme Members
**File**: `backend/api/schemes/get_members.php`
- **Endpoint**: `GET /api/schemes/get_members.php?schemeId={id}`
- **Functionality**:
  - Returns all active members of a specific scheme
  - Joins `customers` and `customer_schemes` tables
  - Groups by customer to handle multiple memberships
  - Returns customer details with membership count

---

### 3. Frontend Service Layer

**File**: `frontend/src/services/api.ts`

#### API Service Methods:

```typescript
// Get all members of a scheme
async getSchemeMembers(schemeId: string): Promise<Customer[]>

// Add customers to a scheme
async addCustomersToScheme(
    schemeId: string, 
    customerIds: string[]
): Promise<any>
```

**Implementation** (lines 196-210):
- `getSchemeMembers`: Calls `GET /api/schemes/get_members.php`
- `addCustomersToScheme`: Calls `POST /api/schemes/add_customers.php` with JSON body

---

### 4. Frontend UI Layer

#### A. Scheme List Page
**File**: `frontend/src/pages/SchemeList.tsx`

**Components**:
1. **"Assign Members" Button** (in each scheme card)
   - Opens modal for customer selection
   - Located at bottom of each scheme card

2. **Assignment Modal** (lines 377-466)
   - Displays all active customers with checkboxes
   - Shows selected customer count
   - Allows multi-select
   - Has Cancel and Add buttons

**State Management**:
```typescript
const [showAddCustomersModal, setShowAddCustomersModal] = useState<string | null>(null);
const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
const [addingCustomers, setAddingCustomers] = useState(false);
```

**Flow**:
1. User clicks "Assign Members" button
2. Modal opens showing all customers
3. User selects customers via checkboxes
4. User clicks "Add" button
5. `handleAddCustomers()` function is called
6. API service adds customers to scheme
7. Scheme list refreshes to show updated member count

#### B. Chit Schedule Page
**File**: `frontend/src/pages/ChitSchedule.tsx`
- Also uses `addCustomersToScheme` API (line 281)
- Similar functionality for assigning members during schedule creation

---

## How to Use

### Assigning Customers to a Scheme:

1. **Navigate to Scheme List**
   - Go to `/schemes` route
   - View all available chit schemes

2. **Click "Assign Members" Button**
   - Located at the bottom of each scheme card
   - Opens a modal dialog

3. **Select Customers**
   - Modal displays all active customers
   - Check the boxes next to customers you want to assign
   - Selected count is displayed at the top

4. **Confirm Assignment**
   - Click "Add {count} Customer(s)" button
   - System validates and adds customers
   - Success message is shown
   - Scheme member count updates automatically

---

## Data Flow Diagram

```
User Action (Click "Assign Members")
    ↓
Frontend: SchemeList.tsx
    ↓ (setShowAddCustomersModal)
Modal Opens → Display Customers
    ↓ (User selects customers)
handleAddCustomers() called
    ↓
API Service: api.ts
    ↓ (POST request)
Backend: add_customers.php
    ↓ (Database transaction)
Database: customer_schemes table
    ↓ (INSERT records)
Update: chit_schemes.current_members
    ↓ (Response)
Frontend: Refresh scheme list
    ↓
UI Updates: Show new member count
```

---

## Key Files Summary

| Layer | File | Purpose |
|-------|------|---------|
| **Database** | `backend/config/init_database.php` | Creates `customer_schemes` table |
| **Backend API** | `backend/api/schemes/add_customers.php` | Adds customers to scheme |
| **Backend API** | `backend/api/schemes/get_members.php` | Gets scheme members |
| **Frontend Service** | `frontend/src/services/api.ts` | API service methods |
| **Frontend UI** | `frontend/src/pages/SchemeList.tsx` | User interface for assignment |
| **Frontend UI** | `frontend/src/pages/ChitSchedule.tsx` | Alternative assignment UI |

---

## Important Notes

1. **Multiple Memberships**: Customers can join the same scheme multiple times (no unique constraint)

2. **Member Limits**: System checks `total_members` vs `current_members` before adding

3. **Status Management**: Memberships have status (active/completed/cancelled)

4. **Transaction Safety**: Backend uses database transactions to ensure data integrity

5. **Real-time Updates**: Frontend refreshes scheme list after assignment to show updated counts

---

## Testing the Feature

1. Ensure backend server is running: `php -S localhost:8000 -t backend`
2. Ensure frontend is running: `npm run dev` in frontend directory
3. Navigate to Scheme List page
4. Click "Assign Members" on any scheme
5. Select customers and confirm
6. Verify member count updates in the scheme card

