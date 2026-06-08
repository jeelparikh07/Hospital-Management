# Hospital Management - Startup Guide

## Quick Start (Follow these steps in order)

### Step 1: Start MongoDB
Open a **NEW PowerShell window** and run:
```powershell
mongod
```
Keep this window open. You should see: `waiting for connections on port 27017`

### Step 2: Seed the Database
Open a **NEW PowerShell window** and run:
```powershell
cd "D:\Hospital Management"
npm run seed
```
Wait for: `✅ Database seeded successfully!`

### Step 3: Start Both Servers
In the **SAME PowerShell window** (after seeding), run:
```powershell
npm run dev:all
```
Wait for both:
- `✅ Connected to MongoDB`
- `🚀 Server running on port 5000`
- `ready started on port 3000`

### Step 4: Open Browser
1. Go to: `http://localhost:3000`
2. Login with: `patient@example.com` / `password123`
3. You should see the dashboard with hospitals listed

### Step 5: Book a Token
1. Click "Book Token" button (top right)
2. Select a Hospital
3. Select a Department  
4. Select a Doctor
5. Click "Confirm Booking"

---

## Troubleshooting

### If you see "Cannot connect to server"
- Make sure backend server is running (check for "🚀 Server running on port 5000")
- Check if MongoDB is running (check for "waiting for connections")

### If you see "Invalid token"
- Clear browser localStorage: Open Console (F12) and run:
  ```javascript
  localStorage.clear()
  ```
- Refresh page and login again

### If booking button is disabled
- Make sure you've selected all three: Hospital → Department → Doctor

### If no hospitals appear
- Run `npm run seed` again to populate the database
- Check console for API errors

---

## Console Debugging

Open browser Console (F12) and look for these logs:
- `*** PATIENT DASHBOARD RENDERING ***` - Page loaded
- `useEffect triggered` - Auth check started
- `Loading data for user: xxx` - Data fetching started
- `Hospitals response: ...` - Hospitals fetched
- `=== handleBookToken called ===` - Booking started

If you see errors, copy them and check:
1. Is MongoDB running?
2. Is backend server running on port 5000?
3. Is database seeded?
