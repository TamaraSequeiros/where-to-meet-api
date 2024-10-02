const express = require('express');
const where = require('./where');
const cors = require('cors')

const app = express();
const PORT = 3000;

app.use(function (req, res, next) {
    console.log('Request URL:', req.originalUrl);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.json());
app.use(cors()) 
app.use('/where', where);

app.listen(PORT);
