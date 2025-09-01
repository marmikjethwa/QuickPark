# QuickPark

QuickPark is a **smart parking management system** built with **Node.js and Express**, featuring a web-based dashboard to manage vehicle entry, exit, parking charges, and status monitoring. It also integrates **OpenCV.js** for potential license plate recognition and vehicle tracking.

---

## 📑 Table of Contents
- [Introduction](#introduction)  
- [Features](#features)  
- [Project Structure](#project-structure)  
- [Installation](#installation)  
- [Usage](#usage)  
- [Functionalities Explained](#functionalities-explained)  
- [Dependencies](#dependencies)  
- [Configuration](#configuration)  
- [Examples](#examples)  
- [Troubleshooting](#troubleshooting)  
- [Contributors](#contributors)  
- [License](#license)  

---

## 🚀 Introduction
QuickPark simplifies the management of parking spaces by providing a **digital interface** for entry, exit, and billing. It allows administrators to monitor vehicles, calculate charges automatically, and view real-time parking availability through a web dashboard.

---

## ✨ Features
- **Vehicle Entry Management** – Record and validate incoming vehicles.  
- **Vehicle Exit Management** – Manage vehicle departure and calculate charges.  
- **Parking Charges** – Automatically calculate charges based on duration.  
- **Dashboard View** – Overview of parking lot occupancy and activity.  
- **Parking Status View** – List of all currently parked vehicles.  
- **OpenCV.js Integration** – Optional support for license plate recognition.  
- **Responsive Web UI** – Simple HTML, CSS, and JS frontend.  

---

## 📂 Project Structure
```
QuickPark-main/
│── server.js              # Backend Express server
│── package.json           # Node.js dependencies
│── public/
│   ├── index.html         # Landing page
│   ├── dashboard.html     # Admin dashboard
│   ├── entry.html         # Vehicle entry page
│   ├── exit.html          # Vehicle exit page
│   ├── view.html          # View parked vehicles
│   ├── charges.html       # Parking charges page
│   ├── *.js               # Corresponding frontend logic
│   ├── style.css          # Styling
│   └── OpenCV.js          # License plate recognition support
└── .gitignore
```

---

## ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/QuickPark.git
   cd QuickPark-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   node server.js
   ```

4. Open your browser at:
   ```
   http://localhost:3000
   ```

---

## 💡 Usage
- Go to the **Entry Page** to register a new vehicle.  
- Use the **Exit Page** to check out a vehicle and generate charges.  
- Visit the **Dashboard** to monitor occupancy.  
- Check the **View Page** to see currently parked vehicles.  
- Open the **Charges Page** to review the billing system.  

---

## 🛠 Functionalities Explained

### 1. **Entry System** (`entry.html` + `entry.js`)
- Records a vehicle’s **license plate number** and **entry time**.  
- Stores entry details in the backend.  
- Optionally integrates with `OpenCV.js` for **automatic license plate recognition**.

### 2. **Exit System** (`exit.html` + `exit.js`)
- Handles vehicle checkout.  
- Matches exit data with entry records.  
- Calculates parking duration and charges.  
- Removes the vehicle from the “currently parked” list.

### 3. **Charges Calculation** (`charges.html` + `charges.js`)
- Calculates parking charges dynamically based on:  
  - **Entry time vs exit time**  
  - **Rate settings** (defined in backend logic).  
- Displays charges to user/attendant.

### 4. **Dashboard** (`dashboard.html`)
- Provides administrators an overview of:  
  - **Current occupancy**  
  - **Recent entries/exits**  
  - **Parking statistics**  

### 5. **View Parked Vehicles** (`view.html` + `view.js`)
- Lists all vehicles currently parked.  
- Displays vehicle number, entry time, and slot info.  
- Helps attendants quickly check availability.

### 6. **Backend Server** (`server.js`)
- Built with **Express.js**.  
- Serves frontend pages from `/public`.  
- Handles entry/exit API requests.  
- Manages in-memory storage (or connects to a database if extended).  

---

## 📦 Dependencies
- **Node.js** (runtime environment)  
- **Express.js** (backend server)  
- **OpenCV.js** (optional, for image processing & license plate recognition)  
- Standard frontend stack: **HTML, CSS, JavaScript**

---

## 🔧 Configuration
- Default server runs on **port 3000**.  
- To change the port, update `server.js`:  
  ```js
  const PORT = process.env.PORT || 3000;
  ```

- Parking rates can be configured in backend logic (inside charge calculation functions).

---

## 📘 Examples
- **New Entry**: Enter vehicle number → Vehicle saved with timestamp.  
- **Exit Vehicle**: Enter vehicle number → System fetches entry → Calculates charges.  
- **Dashboard**: Shows "15/20 slots filled".  
- **Charges Page**: "Car ABC1234 stayed 2 hrs → ₹40".  

---

## 🐛 Troubleshooting
- **Server not starting** → Ensure Node.js is installed.  
- **Frontend not loading** → Check if server is running at `http://localhost:3000`.  
- **Charges not showing correctly** → Verify system time and charge logic in `charges.js`.  
- **OpenCV.js errors** → Make sure browser supports WASM (latest Chrome/Firefox recommended).  

---

## 👥 Contributors
- **Your Name** – Developer  
- Contributions welcome! Open a pull request or issue.  

---

## 📄 License
This project is licensed under the **MIT License** – feel free to use and modify.  
