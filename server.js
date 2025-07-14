// Load environment and packages
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static('public'));

// Temporary OTP storage
const otpMap = new Map(); // userId -> otp

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'marmikjethwa@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD // store in .env
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/entry', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'entry.html'));
});

app.get('/exit', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'exit.html'));
});

app.get('/view', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});
app.get('/charges',(req,res) => {
  res.sendFile(path.join(__dirname,'public','charges.html'))
});
// Add more as needed


// Schemas
const vendorSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  fixedCharge: { type: Number, required: true },
  hourlyCharge: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const vehicleSchema = new mongoose.Schema({
  entryId: { type: Number, required: true, unique: true },
  numberPlate: { type: String, required: true, uppercase: true },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date },
  parkingLot: { type: Number, required: true },
  status: { type: String, enum: ['parked', 'exited'], default: 'parked' },
  vendorId: { type: String, required: true },
  amount: mongoose.Schema.Types.Mixed,
  hoursParked: { type: Number, default: 0 }
});

const parkingLotSchema = new mongoose.Schema({
  lotNumber: { type: Number, required: true },
  occupied: { type: Boolean, default: false },
  vehicleId: Number,
  vendorId: { type: String, required: true }
});


const counterSchema = new mongoose.Schema({
  name: String,
  value: Number
});

// Models
const Vendor = mongoose.model('Vendor', vendorSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const ParkingLot = mongoose.model('ParkingLot', parkingLotSchema);
const Counter = mongoose.model('Counter', counterSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  if (err) return res.status(403).json({ error: 'Invalid token' });
  req.user = user;
  next();
});


};


// Utility
async function getNextEntryId() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'entryId' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}

async function findAvailableParkingLot(vendorId) {
  const lot = await ParkingLot.findOne({ vendorId, occupied: false }).sort({ lotNumber: 1 });
  return lot?.lotNumber || null;
}


async function initializeDatabase() {
  if (await ParkingLot.countDocuments() === 0) {
    await ParkingLot.insertMany(Array.from({ length: 100 }, (_, i) => ({ lotNumber: i + 1 })));
  }
  if (!(await Counter.findOne({ name: 'entryId' }))) {
    await Counter.create({ name: 'entryId', value: 1 });
  }
}

// Routes
app.post('/api/vendor/register', async (req, res) => {
  const { userId, password, fixedCharge, hourlyCharge } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = await Vendor.findOne({ userId });
  if (exists) return res.status(409).json({ error: 'Vendor exists' });

  const hashed = await bcrypt.hash(password, 10);
  const vendor = await Vendor.create({ userId, password: hashed, fixedCharge, hourlyCharge });

  // Create 100 lots for this vendor
  const lots = Array.from({ length: 100 }, (_, i) => ({
    lotNumber: i + 1,
    vendorId: userId,
  }));

  await ParkingLot.insertMany(lots);

  res.status(201).json({ message: 'Registered', vendorId: vendor.userId });
});


app.post('/api/vendor/login', async (req, res) => {
  const { userId, password } = req.body;
  const vendor = await Vendor.findOne({ userId });
  if (!vendor || !(await bcrypt.compare(password, vendor.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMap.set(userId, otp);

  try {
    await transporter.sendMail({
      from: '"Momentum PMS" <marmikjethwa@gmail.com>',
      to: userId,
      subject: 'Your Login OTP - Momentum Parking System',
      text: `Hello ${userId},\n\nYour OTP for login is: ${otp}\n\nThank you,\nMomentum PMS Team`
    });

    res.json({ message: 'OTP sent to email', tempUserId: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

app.post('/api/vendor/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;
  if (otpMap.get(userId) === otp) {
    otpMap.delete(userId);
    const vendor = await Vendor.findOne({ userId });
    const token = jwt.sign({ userId }, process.env.JWT_SECRET || 'parking_secret_key', { expiresIn: '24h' });
    res.json({ token, vendor: { userId, fixedCharge: vendor.fixedCharge, hourlyCharge: vendor.hourlyCharge } });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

app.put('/api/vendor/prices', authenticateToken, async (req, res) => {
    const { fixedCharge, hourlyCharge } = req.body;
    const vendor = await Vendor.findOneAndUpdate(
        { userId: req.user.userId },
        { fixedCharge, hourlyCharge, updatedAt: new Date() },
        { new: true }
    ).select('-password');

    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Updated', vendor });
});

app.get('/api/vendor/profile', authenticateToken, async (req, res) => {
    const vendor = await Vendor.findOne({ userId: req.user.userId }).select('-password');
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor });
});

app.post('/api/vehicle/entry', authenticateToken, async (req, res) => {
    try {
        let plate = req.body.numberPlate?.toUpperCase().replace(/IND/g, '').replace(/[^A-Z0-9]/g, '');
        if (!plate) return res.status(400).json({ error: 'Number plate is required' });

        const exists = await Vehicle.findOne({ numberPlate: plate, vendorId: req.user.userId, status: 'parked' });
        if (exists) return res.status(409).json({ error: 'Vehicle already parked' });

        const lot = await findAvailableParkingLot(req.user.userId);
        if (!lot) return res.status(503).json({ error: 'No parking available' });

        const entryId = await getNextEntryId();
        const vehicle = await Vehicle.create({
            entryId,
            numberPlate: plate,
            parkingLot: lot,
            vendorId: req.user.userId
        });

        await ParkingLot.findOneAndUpdate(
            { lotNumber: lot, vendorId: req.user.userId },
            { occupied: true, vehicleId: entryId }
        );

        res.status(201).json({ message: 'Vehicle entered', vehicle });
    } catch (err) {
        console.error('Entry error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/vehicle/exit', authenticateToken, async (req, res) => {
    try {
        const plate = req.body.numberPlate?.toUpperCase().trim();
        const vehicle = await Vehicle.findOne({ numberPlate: plate, vendorId: req.user.userId, status: 'parked' });
        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found or already exited' });

        const vendor = await Vendor.findOne({ userId: req.user.userId });
        const exitTime = new Date();
        const hours = Math.ceil((exitTime - vehicle.entryTime) / (1000 * 60 * 60));
        const total = vendor.fixedCharge + (hours * vendor.hourlyCharge);

        vehicle.exitTime = exitTime;
        vehicle.status = 'exited';
        vehicle.amount = total;
        vehicle.hoursParked = hours;
        await vehicle.save();

       await ParkingLot.findOneAndUpdate(
  { lotNumber: vehicle.parkingLot, vendorId: req.user.userId },
  { occupied: false, vehicleId: null }
);


        res.json({ message: 'Vehicle exited', bill: { ...vehicle.toObject(), totalAmount: total } });
    } catch (err) {
        console.error('Exit error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/vehicles', authenticateToken, async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = { vendorId: req.user.userId };
    if (status) filter.status = status;

    const vehicles = await Vehicle.find(filter).sort({ entryTime: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Vehicle.countDocuments(filter);

    res.json({ vehicles, pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) } });
});

app.get('/api/parking-lots', authenticateToken, async (req, res) => {
    const lots = await ParkingLot.find({ vendorId: req.user.userId }).sort({ lotNumber: 1 });

    res.json({
        lots,
        summary: {
            total: lots.length,
            occupied: lots.filter(lot => lot.occupied).length,
            available: lots.filter(lot => !lot.occupied).length
        }
    });
});

app.post('/api/vendor/send-signup-otp', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID (email) is required' });

  const exists = await Vendor.findOne({ userId });
  if (exists) return res.status(409).json({ error: 'User already exists' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpMap.set(userId, otp);

  try {
    await transporter.sendMail({
      from: '"Momentum PMS" <marmiksjethwa10@gmail.com>',
      to: userId,
      subject: 'Your Signup OTP - Momentum Parking System',
      text: `Hello,\n\nYour OTP for signup is: ${otp}\n\nThank you,\nMomentum PMS Team`
    });

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/ocr', authenticateToken, async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'Image required' });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              },
              {
                text: "Detect the vehicle number plate in this image. Return only the text of the plate without extra explanation."
              }
            ]
          }
        ]
      })
    });

    const result = await response.json();

    if (result.error) {
      return res.status(500).json({ error: 'OCR failed', details: result.error.message });
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });

  } catch (err) {
    res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});


app.post('/api/vendor/verify-signup-otp', (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ error: 'Missing fields' });

  if (otpMap.get(userId) === otp) {
    otpMap.delete(userId);
    res.json({ message: 'OTP verified' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback routes
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Start server
app.listen(PORT, async () => {
    console.log(`Laude chaalu ho gayaa at Port: ${PORT}`);
    await initializeDatabase();
});
