const express = require('express');
const where = require('./where');

const app = express();
const PORT = 3000;

app.use(function (req, res, next) {
    console.log('Request URL:', req.originalUrl);
    next();
});

app.use(express.json());
app.use('/where', where);

app.listen(PORT);
