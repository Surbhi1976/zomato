// create server
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');

const app = express();

// behind a reverse proxy (Render, Railway, Nginx...) the real client IP is needed for rate limiting
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','),
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('hello');
});

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

// central error handler (Express 5 forwards async errors here automatically)
app.use((err, req, res, next) => {
    console.error(err);
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }
    res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

module.exports = app;
