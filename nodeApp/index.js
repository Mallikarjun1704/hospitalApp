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

dotenv.config();
const app = express();
app.use(express.json());

// Enable CORS for the React frontend (default origin http://localhost:3000)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: corsOrigin, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
// Respond to preflight requests for all routes
app.options('*', cors({ origin: corsOrigin, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));

// Public helper route to download a sample medicines CSV (authenticated users can also fetch this via API)
app.get('/api/v1/medicine/medicines/sample-csv', (req, res) => {
  const headers = ['code', 'name', 'stock', 'purchasePrice', 'salePrice', 'purchaseDate', 'expiryDate', 'manufacturer', 'description'];
  const sampleRow = ['MED-0001', 'Paracetamol', '100', '10.00', '12.00', '2025-01-01', '2026-01-01', 'Acme', 'Pain relief'].join(',');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="medicine-sample.csv"');
  res.send(headers.join(',') + '\n' + sampleRow + '\n');
});

mongoose.connect(process.env.MONGO_BD)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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
app.use('/api/v1', authenticateToken, userRoutes);
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
} else {
  console.log('HTTPS cert/key not found — HTTPS server not started. To enable HTTPS, place key/cert at ./certs/ or set HTTPS_KEY and HTTPS_CERT env vars.');
}