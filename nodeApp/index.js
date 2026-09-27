const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
//new changes
const fs = require('fs');
const https = require('https');
const cors = require('cors');
/** Login and user data fetch api's*/
const loginRoutes = require('./routes/login');
const userRoutes = require('./routes/userRoute');
const jwt = require('jsonwebtoken');
const tokenStore = require('./utils/tokenStore');
/**Medicine inventory management api's*/
const MedicineRoutes = require('./routes/medicine');
const SaleRoutes = require('./routes/sale');
const PatientRoutes = require('./routes/patient');
const CashBillRoutes = require('./routes/cashbill');
const LabTestsRoutes = require('./routes/labtests');
const MedicalBillRoutes = require('./routes/medicalbill');
const LabBillRoutes = require('./routes/labbill');
const DischargeSummaryRoutes = require('./routes/dischargesummary');

const seedAdminUser = require('./utils/dbSeed');

dotenv.config();
const app = express();
app.use(express.json());

// Dynamic CORS configuration allowing localhost, local network Wi-Fi IPs, and Electron origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Electron file://, curl, Postman)
    if (!origin) return callback(null, true);

    // Accept localhost, 127.0.0.1, or local LAN IP addresses (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
    
    if (isLocalNetwork || process.env.CORS_ORIGIN === '*' || origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }
    // Default fallback to allow connection
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// Respond to preflight requests for all routes
app.options('*', cors(corsOptions));

// Health check endpoint for connection validation / ping
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Hospital Backend API',
    uptime: process.uptime()
  });
});

// Public helper route to download a sample medicines CSV (authenticated users can also fetch this via API)
app.get('/api/v1/medicine/medicines/sample-csv', (req, res) => {
  const headers = ['code', 'name', 'stock', 'purchasePrice', 'salePrice', 'purchaseDate', 'expiryDate', 'manufacturer', 'description'];
  const sampleRow = ['MED-0001', 'Paracetamol', '100', '10.00', '12.00', '2025-01-01', '2026-01-01', 'Acme', 'Pain relief'].join(',');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="medicine-sample.csv"');
  res.send(headers.join(',') + '\n' + sampleRow + '\n');
});

const mongoUri = process.env.MONGO_BD || process.env.MONGO_URI || 'mongodb://localhost:27017/userData';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('[DATABASE] MongoDB connected successfully');
    // Run administrator seeding check
    await seedAdminUser();
  })
  .catch(err => console.error('[DATABASE] MongoDB connection error:', err));

//Set-ExecutionPolicy RemoteSigned & Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  // reject immediately if the access token is revoked
  if (tokenStore.hasRevokedAccessToken(token)) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};




// Use routes
app.use('/api/v1', loginRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1/medicine', authenticateToken, MedicineRoutes);
//app.use('/api/v1/medicine', MedicineRoutes);
app.use('/api/v1/sale', authenticateToken, SaleRoutes);
//app.use('/api/v1/sale', SaleRoutes);

// Patient routes (CRUD + filter by contact)
app.use('/api/v1/patients', authenticateToken, PatientRoutes);
// Cash bill routes
app.use('/api/v1/cashbills', authenticateToken, CashBillRoutes);
// lab tests
app.use('/api/v1/labtests', authenticateToken, LabTestsRoutes);
// Medical & Lab bill routes
app.use('/api/v1/medicalbills', authenticateToken, MedicalBillRoutes);
app.use('/api/v1/labbills', authenticateToken, LabBillRoutes);
app.use('/api/v1/dischargesummaries', authenticateToken, DischargeSummaryRoutes);


// Start HTTP server
const HTTP_PORT = process.env.PORT || 8889;
app.listen(HTTP_PORT, () => console.log(`HTTP Server running on port ${HTTP_PORT}`));

//new changes
// Optionally start HTTPS server if cert and key are available
const httpsKeyPath = process.env.HTTPS_KEY || './certs/key.pem';
const httpsCertPath = process.env.HTTPS_CERT || './certs/cert.pem';
if (fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)) {
  try {
    const options = {
      key: fs.readFileSync(httpsKeyPath),
      cert: fs.readFileSync(httpsCertPath)
    };
    const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
    https.createServer(options, app).listen(HTTPS_PORT, () => console.log(`HTTPS Server running on port ${HTTPS_PORT}`));
  } catch (err) {
    console.error('Failed to start HTTPS server:', err);
  }
}