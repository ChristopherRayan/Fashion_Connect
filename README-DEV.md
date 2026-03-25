# FashionConnect Development Setup

## Prerequisites
1. Node.js installed
2. MongoDB installed and running
3. npm or yarn package manager

## Environment Setup

### Backend (.env file in backend folder)
```
PORT=8000
MONGO_URI=mongodb://localhost:27017/fashion_connect_db
CORS_ORIGIN=http://localhost:5173
USE_MOCK_DATA=false
# ... other environment variables
```

### Frontend (.env file in frontend folder)
```
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=FashionConnect
VITE_APP_VERSION=1.0.0
```

## Starting the Development Servers

### Option 1: Using the Batch File (Windows)
Double-click on `start-dev.bat` to start both servers automatically.

### Option 2: Manual Start

#### Start Backend Server:
```bash
cd backend
npm install
npm run dev
```

#### Start Frontend Server:
```bash
cd frontend
npm install
npm run dev
```

## Accessing the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/api/v1/health

## Troubleshooting

### If you see "404 Not Found" for tailor profile endpoint:
1. Check that `USE_MOCK_DATA=false` in backend .env
2. Verify MongoDB is running and accessible
3. Check backend console logs for "Using database routes" message

### If you see "Connection Refused" for frontend:
1. Make sure frontend server is running
2. Check that port 5173 is not blocked by firewall

### Testing MongoDB Connection:
```bash
cd backend
node test-mongo.js
```

### Testing API Endpoints:
```bash
cd backend
node test-api.js
```