const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const analyticsRouter = require('./routes/analytics');
const offerRouter = require('./routes/offer');
const BatchRouter = require('./routes/batches');

const app = express();

const allowedOrigins = [
  'http://localhost:8080',
  'https://zeusbcc.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};


const uploadsPath = path.join(__dirname, 'uploads');

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsPath));

app.use('/auth', authRouter);
app.use('/analytics', analyticsRouter);
app.use('/offer', offerRouter);
app.use('/batches', BatchRouter);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is online' });
});

module.exports = app;


