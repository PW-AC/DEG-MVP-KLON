# 🚀 DEG-MVP Application - Start Instructions

## ✨ Quick Start (Recommended)

### Start Both Servers Together:
```bash
./start-all.sh
```
This will start both backend (port 8000) and frontend (port 3000) servers.

---

## 🔧 Manual Start (Alternative)

### Option 1: Start Backend Only
```bash
./start-backend.sh
```
Or manually:
```bash
cd backend
source venv/bin/activate
python server.py
```

### Option 2: Start Frontend Only
```bash
./start-frontend.sh
```
Or manually:
```bash
cd frontend
yarn start
```

---

## 📌 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## ⚠️ Troubleshooting

### If "command not found" error:
1. **Backend**: Make sure you're in the virtual environment
   ```bash
   cd backend
   source venv/bin/activate
   ```

2. **Frontend**: Make sure dependencies are installed
   ```bash
   cd frontend
   yarn install
   ```

### If ports are already in use:
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9
```

---

## 🎨 Modern Design Features

The application has been completely redesigned with:
- Modern purple/indigo color scheme
- Smooth animations and transitions
- Professional Lucide React icons
- Responsive design for all devices
- Clean, minimalist interface
- Improved user experience

---

## 📝 Notes

- The backend uses a Python virtual environment to avoid system package conflicts
- All dependencies are automatically installed when using the startup scripts
- Press `Ctrl+C` to stop the servers when using `start-all.sh`