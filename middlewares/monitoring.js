
const moment = require('moment');

// Global variables to store live monitoring data
global.monitoringStats = {
    totalRequests: 0,
    activeDevices: new Set(),
    last24hTransactions: 0,
    platformDistribution: {
        android: 0,
        ios: 0,
        smarttv: 0,
        web: 0,
        other: 0
    },
    monthlyRevenue: Array(6).fill(0), // Last 6 months
    dailyRegistrations: Array(7).fill(0), // Last 7 days
    macStats: new Map(),
    logs: []
};

// Track requests middleware
global.trackRequest = (req, res, next) => {
    const ip = global.getClientIPAddress(req);
    const userAgent = global.getUserAgent(req);
    const endpoint = req.originalUrl;
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // Extract MAC address from various endpoints
    let macAddress = null;
    if (req.params.mac_address) {
        macAddress = req.params.mac_address;
    } else if (req.body && req.body.mac_address) {
        macAddress = req.body.mac_address;
    }
    
    // Determine platform from user agent
    let platform = 'other';
    if (userAgent.toLowerCase().includes('android')) {
        platform = 'android';
    } else if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad')) {
        platform = 'ios';
    } else if (userAgent.toLowerCase().includes('smart') || userAgent.toLowerCase().includes('tizen')) {
        platform = 'smarttv';
    } else if (userAgent.toLowerCase().includes('mozilla')) {
        platform = 'web';
    }
    
    // Update stats
    global.monitoringStats.totalRequests++;
    global.monitoringStats.platformDistribution[platform]++;
    
    if (macAddress) {
        global.monitoringStats.activeDevices.add(macAddress);
        
        // Update MAC stats
        if (!global.monitoringStats.macStats.has(macAddress)) {
            global.monitoringStats.macStats.set(macAddress, {
                totalRequests: 0,
                ipAddresses: new Set(),
                firstRequest: timestamp,
                lastRequest: timestamp,
                endpoints: new Set()
            });
        }
        
        const macStat = global.monitoringStats.macStats.get(macAddress);
        macStat.totalRequests++;
        macStat.ipAddresses.add(ip);
        macStat.lastRequest = timestamp;
        macStat.endpoints.add(endpoint);
    }
    
    // Add to logs (keep only last 1000 entries)
    global.monitoringStats.logs.unshift({
        timestamp,
        macAddress: macAddress || 'N/A',
        endpoint,
        ip,
        userAgent,
        status: 'Processing'
    });
    
    if (global.monitoringStats.logs.length > 1000) {
        global.monitoringStats.logs = global.monitoringStats.logs.slice(0, 1000);
    }
    
    // Emit real-time update via Socket.IO if available
    if (global.io) {
        global.io.emit('newRequest', {
            timestamp,
            macAddress,
            endpoint,
            ip,
            platform,
            totalRequests: global.monitoringStats.totalRequests,
            activeDevices: global.monitoringStats.activeDevices.size
        });
    }
    
    // Override res.status to capture response status
    const originalStatus = res.status;
    res.status = function(statusCode) {
        // Update the log entry with final status
        if (global.monitoringStats.logs.length > 0 && 
            global.monitoringStats.logs[0].timestamp === timestamp) {
            global.monitoringStats.logs[0].status = statusCode;
        }
        return originalStatus.call(this, statusCode);
    };
    
    next();
};

module.exports = { trackRequest: global.trackRequest };
