# 🏥 Smart Hospital Queue Management System

A modern, full-stack digital queue management platform for hospitals that eliminates long waiting times through real-time tracking, smart notifications, and AI-powered wait time predictions.

![QueueMed](https://img.shields.io/badge/QueueMed-Healthcare%20Tech-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-8-green?logo=mongodb)

## ✨ Features

### 🎯 Core Features
- **Real-time Queue Tracking** - Live updates using Socket.io
- **Digital Token Booking** - Book tokens online or walk-in
- **AI Wait Time Prediction** - Smart predictions based on historical data
- **Multi-role Dashboards** - Patient, Doctor, Receptionist, Admin
- **Smart Notifications** - Get notified when your turn is near
- **Analytics Dashboard** - Comprehensive insights and metrics

### 🎨 Design Features
- **Glassmorphism UI** - Modern glass-like design elements
- **Smooth Animations** - Framer Motion powered interactions
- **Responsive Design** - Mobile-first, works on all devices
- **Dark Mode Ready** - Easy to extend with dark theme
- **Accessibility** - WCAG 2.1 compliant components

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd "D:\Hospital Management"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env

# Update the values in .env file
# MONGODB_URI=mongodb://localhost:27017/smart-hospital-queue
# JWT_SECRET=your-secret-key
# PORT=5000
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running on your system
# Default: mongodb://localhost:27017
```

5. **Seed sample data (Optional)**
```bash
npm run seed
```

6. **Run the application**
```bash
# Run both frontend and backend concurrently
npm run dev:all

# Or run separately:
npm run dev      # Frontend (Next.js) - http://localhost:3000
npm run server   # Backend (Express) - http://localhost:5000
```

## 📁 Project Structure

```
D:\Hospital Management/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── login/             # Auth pages
│   │   ├── signup/
│   │   ├── patient/           # Patient dashboard
│   │   ├── doctor/            # Doctor dashboard
│   │   ├── reception/         # Receptionist dashboard
│   │   ├── admin/             # Admin dashboard
│   │   └── display/           # Waiting room display
│   ├── components/
│   │   └── ui/                # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Badge.tsx
│   │       ├── Avatar.tsx
│   │       └── Loading.tsx
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── mongodb.ts         # DB connection
│   │   ├── utils.ts           # Utilities
│   │   └── aiPrediction.ts    # AI wait time prediction
│   ├── models/                # MongoDB models
│   │   ├── User.ts
│   │   ├── Hospital.ts
│   │   ├── Department.ts
│   │   ├── Token.ts
│   │   └── Queue.ts
│   ├── hooks/
│   │   └── useSocket.ts       # Socket.io hook
│   └── store/
│       └── authStore.ts       # Auth state (Zustand)
├── server/
│   ├── index.ts               # Express server
│   ├── socket.ts              # Socket.io handlers
│   ├── middleware/
│   │   └── auth.ts            # Auth middleware
│   └── routes/
│       ├── auth.ts
│       ├── hospital.ts
│       ├── department.ts
│       ├── token.ts
│       ├── queue.ts
│       ├── user.ts
│       └── analytics.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 🎭 User Roles

### 👤 Patient
- Book tokens online
- Track queue position in real-time
- View estimated wait time
- Receive notifications
- View token history

### 👨‍⚕️ Doctor
- View today's patient queue
- Call next patient
- Skip or complete consultations
- View analytics and performance

### 📋 Receptionist
- Add walk-in patients
- Generate manual tokens
- Manage queue
- View all tokens

### 👑 Admin
- Manage hospitals & departments
- Manage doctors & staff
- View system-wide analytics
- Configure settings

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 🎨 Design System

### Colors
```
Primary:   #2563EB (Medical Blue)
Secondary: #14B8A6 (Teal)
Success:   #22c55e (Green)
Warning:   #f97316 (Orange)
Danger:    #ef4444 (Red)
```

### Typography
- **Headings**: Plus Jakarta Sans
- **Body**: Inter

### Components
All UI components are built with:
- Smooth animations
- Hover effects
- Glassmorphism support
- Responsive design
- Accessibility features

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user
```

### Hospitals
```
GET    /api/hospitals         - Get all hospitals
GET    /api/hospitals/:id     - Get hospital by ID
POST   /api/hospitals         - Create hospital (Admin)
PUT    /api/hospitals/:id     - Update hospital
DELETE /api/hospitals/:id     - Delete hospital
```

### Tokens
```
GET    /api/tokens/patient/:id     - Get patient tokens
GET    /api/tokens/doctor/:id      - Get doctor tokens
GET    /api/tokens/queue/:deptId   - Get queue status
POST   /api/tokens                 - Book new token
POST   /api/tokens/:id/call        - Call token (Doctor)
POST   /api/tokens/:id/complete    - Complete token
POST   /api/tokens/:id/skip        - Skip token
POST   /api/tokens/:id/cancel      - Cancel token
```

### Analytics
```
GET    /api/analytics/dashboard       - Admin dashboard
GET    /api/analytics/doctor/:id      - Doctor analytics
GET    /api/analytics/hospital/:id    - Hospital analytics
```

## 🔌 Socket.io Events

### Client → Server
```
join-hospital        - Join hospital room
join-department      - Join department room
join-doctor          - Join doctor room
token-booked         - Emit when token is booked
token-called         - Emit when token is called
queue-status-update  - Emit queue status change
```

### Server → Client
```
token-updated        - Token data updated
queue-update         - Queue status changed
notification         - New notification
doctor-status        - Doctor status changed
```

## 🤖 AI Wait Time Prediction

The system uses multiple factors to predict wait times:

```typescript
{
  patientsAhead: number,
  doctorAvgConsultationTime: number,
  historicalWaitTimes: number[],
  timeOfDay: number,
  dayOfWeek: number,
  currentQueueSpeed: number,
  isPeakHour: boolean
}
```

Prediction adjustments:
- **Peak Hours**: +30% (9-11 AM, 5-7 PM)
- **Monday/Tuesday**: +20-30%
- **Weekend**: -10%
- **Queue Speed**: Dynamic adjustment

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation
- CORS protection
- Rate limiting ready

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktop (1280px+)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
npm start
```

### Backend (Any Node.js host)
```bash
npm run server
```

### Environment Variables for Production
```
NODE_ENV=production
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<strong-secret>
PORT=5000
NEXT_PUBLIC_API_URL=<your-api-url>
NEXT_PUBLIC_SOCKET_URL=<your-socket-url>
```

## 📊 Demo Credentials

```
Patient:
Email: patient@example.com
Password: password123

Doctor:
Email: doctor@example.com
Password: password123

Admin:
Email: admin@example.com
Password: password123
```

## 🎯 Future Enhancements

- [ ] Google OAuth integration
- [ ] SMS notifications (Twilio)
- [ ] Email notifications
- [ ] Video call integration
- [ ] Prescription management
- [ ] Payment gateway
- [ ] Multi-language support
- [ ] PWA support
- [ ] Offline mode
- [ ] Advanced analytics with charts

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👥 Contributors

Built with ❤️ for modern healthcare management.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**QueueMed** - Revolutionizing Healthcare Queue Management
