const express = require('express');
const cors = require('cors');
const app = express();

const allowedOrigins = [
  'https://cv-management-client-peoq.vercel.app', 
  'https://cv-management-client.vercel.app',     
  'http://localhost:5173'                        
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy does not allow access from this Origin'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); 