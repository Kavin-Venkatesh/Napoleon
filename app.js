const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const batchRouter = require('./routes/batch');

const app = express();

const corsOptions = {
    origin: 'http://localhost:8080' ||  'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
    };


app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/auth', authRouter);
app.use('/batch', batchRouter);


module.exports = app;


