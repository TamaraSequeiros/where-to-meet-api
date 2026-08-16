const express = require('express');
const cors = require('cors');
const where = require('./where');
const places = require('./places');
const address = require('./address');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
    console.log('Request URL:', req.originalUrl);
    next();
});

app.use('/where', where);
app.use('/places', places);
app.use('/address', address);

// Unknown routes
app.use(function (req, res) {
    res.status(404).json({ error: 'Not found' });
});

// Central error handler — must be registered last, and must keep all 4 args
// so Express recognizes it as an error handler.
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
