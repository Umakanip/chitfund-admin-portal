# MySQL Workbench Guide - Checking Your Database

## Step 1: Connect to MySQL Server

1. **In MySQL Workbench**, you should see a connection named **"Local instance wampmysqld64"** (or similar)
2. **Double-click** on that connection to connect
3. Enter password if prompted: **`root`**
4. Click **OK**

## Step 2: Select Your Database

1. In the left sidebar, look for **"SCHEMAS"** section
2. Find **`chitfund_db`** database
3. If you don't see it, click the **refresh icon** (🔄) at the top of the SCHEMAS panel
4. **Click the arrow** next to `chitfund_db` to expand it
5. You should see these tables:
   - `users`
   - `customers`
   - `chit_schemes`
   - `payments`
   - `auctions`

## Step 3: View Table Data

### Method 1: Using Table Context Menu (Easiest)

1. **Right-click** on any table (e.g., `customers`)
2. Select **"Select Rows - Limit 1000"**
3. The data will appear in the bottom panel

### Method 2: Using SQL Query

1. Click on **"SQL"** tab at the top (or press `Ctrl+T`)
2. Type a query, for example:
   ```sql
   SELECT * FROM customers;
   ```
3. Click the **⚡ Execute** button (or press `Ctrl+Enter`)
4. Results will appear below

## Step 4: Useful Queries to Check Your Data

### View All Customers
```sql
SELECT * FROM customers;
```

### View All Chit Schemes
```sql
SELECT * FROM chit_schemes;
```

### View All Users
```sql
SELECT * FROM users;
```

### View All Payments
```sql
SELECT * FROM payments;
```

### View All Auctions
```sql
SELECT * FROM auctions;
```

### Count Records in Each Table
```sql
SELECT 
    'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'chit_schemes', COUNT(*) FROM chit_schemes
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'auctions', COUNT(*) FROM auctions;
```

### View Customers with Details
```sql
SELECT 
    id,
    name,
    email,
    phone,
    status,
    created_at
FROM customers
ORDER BY created_at DESC;
```

### View Schemes with Status
```sql
SELECT 
    id,
    name,
    total_amount,
    status,
    total_members,
    current_members
FROM chit_schemes
ORDER BY id DESC;
```

## Step 5: Test Integration

### Before Adding Data via Frontend:
1. Run: `SELECT COUNT(*) FROM customers;`
2. Note the count

### After Adding a Customer via Frontend:
1. Refresh the query (click ⚡ Execute again)
2. The count should increase
3. Run: `SELECT * FROM customers ORDER BY id DESC LIMIT 1;`
4. You should see your newly added customer!

## Step 6: Verify Data Structure

### Check Table Structure
1. Right-click on a table (e.g., `customers`)
2. Select **"Table Inspector"**
3. Click on **"Columns"** tab to see all columns and their types

### Or use SQL:
```sql
DESCRIBE customers;
DESCRIBE chit_schemes;
DESCRIBE users;
```

## Common Issues & Solutions

### Issue: Database `chitfund_db` not visible
**Solution:** Run the initialization script:
```powershell
cd D:\ChitfundAdminportal\backend
php config/init_database.php
```

### Issue: Can't connect to MySQL
**Solution:** 
- Make sure MySQL service is running (check WAMP/XAMPP control panel)
- Verify password is `root`
- Check if MySQL is running on port 3306

### Issue: Tables are empty
**Solution:**
- This is normal if you haven't added data yet
- Add a customer via the frontend, then refresh the query
- Or check if default data was inserted during initialization

## Quick Reference

- **Database Name:** `chitfund_db`
- **Username:** `root`
- **Password:** `root`
- **Host:** `localhost`
- **Port:** `3306`

## Tips

1. **Auto-refresh:** After making changes in the frontend, refresh your query in Workbench to see updates
2. **Filter data:** Use WHERE clause to filter:
   ```sql
   SELECT * FROM customers WHERE status = 'active';
   ```
3. **Sort data:** Use ORDER BY:
   ```sql
   SELECT * FROM customers ORDER BY name ASC;
   ```
4. **Limit results:** Use LIMIT for large tables:
   ```sql
   SELECT * FROM customers LIMIT 10;
   ```

## Next Steps

1. ✅ Connect to MySQL Workbench
2. ✅ View your tables
3. ✅ Add data via frontend
4. ✅ Verify data appears in database
5. ✅ Edit data via frontend
6. ✅ Verify changes in database

Your database is now ready to use! 🎉

