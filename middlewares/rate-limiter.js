const { rateLimit } = require('express-rate-limit')

const rateLimiter= rateLimit({
    windowMs: 60 * 1000, // 1-minute window
    max: 20,
    legacyHeaders: false,
    skip: (req, res) => {
        return ['127.0.0.1', '::1'].includes(req.ip);
    },
    message: { message: 'Too many requests, please try again later.' },
});

module.exports = { rateLimiter };
