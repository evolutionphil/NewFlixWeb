const { rateLimit } = require('express-rate-limit')

const rateLimiter= rateLimit({
    windowMs: 10 * 1000, // 10-second window
    max: 5,
    legacyHeaders: false,
    skip: (req, res) => {
        return ['127.0.0.1', '::1'].includes(req.ip);
    },
    message: { message: 'Too many requests, please try again later.' },
});

module.exports = { rateLimiter };
