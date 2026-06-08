# 🚀 Quick Start Guide

## Step-by-Step Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# macOS (with Homebrew)
brew services start mongodb-community

# Or manually
mongod --dbpath /data/db
```

### 3. Configure Environment
The `.env` file is already configured with default values. You can modify if needed:
```
MONGODB_URI=mongodb://localhost:27017/smart-hospital-queue
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-in-production-abc123xyz
```

### 4. Seed Database (First Time Only)
```bash
npm run seed
```

This creates:
- 3 Hospitals
- 12 Users (1 Admin, 4 Doctors, 2 Receptionists, 5 Patients)
- Multiple Departments
- 10 Sample Tokens

### 5. Start the Application
```bash
npm run dev:all
```

This runs both:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### 6. Login & Explore

Open http://localhost:3000 and use these credentials:

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@example.com | password123 | /admin/dashboard |
| Doctor | doctor@example.com | password123 | /doctor/dashboard |
| Receptionist | receptionist@example.com | password123 | /reception/dashboard |
| Patient | patient@example.com | password123 | /patient/dashboard |

---

## 📋 Testing the System

### As a Patient:
1. Login with `patient@example.com`
2. Click "Book Token"
3. Select Hospital → Department → Doctor
4. Confirm booking
5. You'll be redirected to the queue tracking page
6. Watch real-time updates!

### As a Doctor:
1. Login with `doctor@example.com`
2. View the patient queue
3. Click "Call Next Patient"
4. Complete or skip patients
5. View analytics

### As a Receptionist:
1. Login with `receptionist@example.com`
2. Click "Add Walk-In"
3. Fill patient details
4. Select hospital/department/doctor
5. Create token

### As an Admin:
1. Login with `admin@example.com`
2. View system-wide analytics
3. Manage hospitals and doctors
4. Monitor queue performance

---

## 🎨 Features to Explore

### Landing Page
- Visit http://localhost:3000
- Beautiful animated hero section
- Feature cards with hover effects
- How it works section
- Pricing section
- Testimonials

### Queue Tracking (Patient)
- Real-time token updates via Socket.io
- Animated progress bar
- Live wait time countdown
- Queue position indicator

### Doctor Dashboard
- Call next patient with animation
- Skip/Complete buttons
- Patient queue list
- Performance metrics

### Waiting Room Display
- Visit http://localhost:3000/display
- Large typography for TV screens
- Animated token transitions
- Live queue status

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in .env file or kill the process using port 5000

### Next.js Build Error
```
Error: Module not found
```
**Solution**: 
```bash
rm -rf node_modules .next
npm install
```

### Socket.io Connection Failed
```
WebSocket connection failed
```
**Solution**: Ensure backend server is running on port 5000

---

## 📱 Mobile Testing

The app is fully responsive. Test on:
- iPhone: 375x667, 390x844
- Android: 360x640, 412x915
- iPad: 768x1024, 834x1112

Use Chrome DevTools Device Mode for testing.

---

## 🎯 Key Pages URLs

```
Landing Page:     http://localhost:3000
Login:            http://localhost:3000/login
Signup:           http://localhost:3000/signup

Patient:
  Dashboard:      http://localhost:3000/patient/dashboard
  Queue Track:    http://localhost:3000/patient/queue/[id]

Doctor:
  Dashboard:      http://localhost:3000/doctor/dashboard

Receptionist:
  Dashboard:      http://localhost:3000/reception/dashboard

Admin:
  Dashboard:      http://localhost:3000/admin/dashboard

Public:
  Display:        http://localhost:3000/display
```

---

## 🔧 Development Tips

### Hot Reload
Both Next.js and Express support hot reload. Changes will reflect automatically.

### API Testing
Use these tools to test APIs:
- Postman
- Insomnia
- curl

Example:
```bash
curl http://localhost:5000/api/hospitals
```

### Database Inspection
Use MongoDB Compass or mongosh:
```bash
mongosh
use smart-hospital-queue
db.users.find()
```

### Socket.io Debugging
Open browser console to see Socket.io logs:
- Connection status
- Event emissions
- Real-time updates

---

## 📊 Performance Tips

1. **Production Build**
   ```bash
   npm run build
   npm start
   ```

2. **Enable Compression**
   Add compression middleware to Express

3. **Database Indexing**
   Indexes are already configured on frequently queried fields

4. **Socket.io Optimization**
   Use rooms for targeted broadcasts

---

## 🎉 You're All Set!

Enjoy exploring the Smart Hospital Queue Management System!

For questions or issues, refer to the main README.md or check the code comments.
