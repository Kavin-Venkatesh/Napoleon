const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const analyticsRouter = require('./routes/analytics');
const offerRouter = require('./routes/offer');
const BatchRouter = require('./routes/batches');

const app = express();

const corsOptions = {
    origin: 'http://localhost:8080' ||  'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
    };

const externalFilesPath = path.join('D:', '/App/BCC/Server/Server/uploads');

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(externalFilesPath));


app.use('/auth', authRouter);
app.use('/analytics', analyticsRouter);
app.use('/offer', offerRouter);
app.use('/batches', BatchRouter);

module.exports = app;


