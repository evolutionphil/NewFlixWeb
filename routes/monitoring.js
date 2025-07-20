
const express = require('express');
const router = express.Router();
const MonitoringController = require('../controllers/MonitoringController');

// Check if user is authenticated admin
function requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/login');
}

// Main monitoring dashboard
router.get('/', requireAuth, MonitoringController.dashboard);

// API endpoints
router.get('/stats', requireAuth, MonitoringController.getStats);
router.post('/block-mac', requireAuth, MonitoringController.blockMac);
router.get('/mac/:macAddress', requireAuth, MonitoringController.getMacDetails);

module.exports = router;
