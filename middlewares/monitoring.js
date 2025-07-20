const moment = require('moment');

// Global variables to store live monitoring data
if (!global.monitoringStats) {
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
}

// Ensure blocked MAC addresses global is initialized
if (!global.blocked_mac_address) {
    global.blocked_mac_address = {};
}

// Initialize monitoring data if not exists
if (!global.monitoringData) {
    global.monitoringData = {
        realtimeLogs: [],
        macStats: new Map(),
        requestCounts: {
            total: 0,
            today: 0,
            yesterday: 0
        },
        dailyStats: new Map()
    };
}

// Track requests middleware - focused on API client requests
global.trackRequest = (req, res, next) => {
    const endpoint = req.originalUrl;
    
    // Only track API endpoints that apps actually use
    const isAPIRequest = endpoint.startsWith('/api/') || 
                        endpoint.includes('playlist_information') ||
                        endpoint.includes('device_info') ||
                        endpoint.includes('get_epg_data') ||
                        endpoint.includes('google_pay') ||
                        endpoint.includes('app_purchase') ||
                        endpoint.includes('saveLockState') ||
                        endpoint.includes('updateParentAccountPassword');
    
    if (!isAPIRequest) {
        return next();
    }
    
    const ip = global.getClientIPAddress(req);
    const userAgent = global.getUserAgent(req);
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // Extract MAC address from various sources
    let macAddress = null;
    if (req.params.mac_address) {
        macAddress = req.params.mac_address;
    } else if (req.body && req.body.mac_address) {
        macAddress = req.body.mac_address;
    } else if (req.query && req.query.mac_address) {
        macAddress = req.query.mac_address;
    }
    
    // Determine platform from endpoint and user agent
    let platform = 'other';
    let appType = 'unknown';
    
    if (endpoint.includes('playlist_information') && req.method === 'POST') {
        platform = 'android';
        appType = 'android';
    } else if (endpoint.includes('playlist_info')) {
        platform = 'ios';
        appType = 'ios';
    } else if (endpoint.includes('device_info')) {
        platform = 'smarttv';
        appType = 'smarttv';
    } else if (endpoint.includes('Ya6qrVdbcxy69CI')) {
        platform = 'windows';
        appType = 'windows';
    } else {
        // Fallback to user agent detection
        const ua = userAgent.toLowerCase();
        if (ua.includes('android')) {
            platform = 'android';
            appType = 'android';
        } else if (ua.includes('iphone') || ua.includes('ipad')) {
            platform = 'ios';
            appType = 'ios';
        } else if (ua.includes('smart') || ua.includes('tizen') || ua.includes('webos')) {
            platform = 'smarttv';
            appType = 'smarttv';
        } else if (ua.includes('windows')) {
            platform = 'windows';
            appType = 'windows';
        }
    }
    
    // Update stats
    global.monitoringStats.totalRequests++;
    global.monitoringStats.platformDistribution[platform]++;
    
    console.log('API Request tracked:', {
        totalRequests: global.monitoringStats.totalRequests,
        endpoint,
        macAddress,
        platform,
        appType,
        ip: ip.substring(0, 10) + '...' // Partial IP for privacy
    });
    
    if (macAddress) {
        global.monitoringStats.activeDevices.add(macAddress);
        
        // Update MAC stats
        if (!global.monitoringStats.macStats.has(macAddress)) {
            global.monitoringStats.macStats.set(macAddress, {
                totalRequests: 0,
                ipAddresses: new Set(),
                firstRequest: timestamp,
                lastRequest: timestamp,
                endpoints: new Set(),
                platform: platform,
                appType: appType
            });
        }
        
        const macStat = global.monitoringStats.macStats.get(macAddress);
        macStat.totalRequests++;
        macStat.ipAddresses.add(ip);
        macStat.lastRequest = timestamp;
        macStat.endpoints.add(endpoint);
        macStat.platform = platform; // Update platform info
        macStat.appType = appType;
    }
    
    // Create detailed log entry for API requests
    const logEntry = {
        timestamp,
        macAddress: macAddress || 'No MAC',
        endpoint,
        ip,
        userAgent,
        platform,
        appType,
        method: req.method,
        status: 'Processing'
    };
    
    // Add to logs (keep only last 1000 entries)
    global.monitoringStats.logs.unshift(logEntry);
    
    if (global.monitoringStats.logs.length > 1000) {
        global.monitoringStats.logs = global.monitoringStats.logs.slice(0, 1000);
    }
    
    // Auto-remove old logs (older than 1 hour)
    const oneHourAgo = moment().subtract(1, 'hour');
    global.monitoringStats.logs = global.monitoringStats.logs.filter(log => 
        moment(log.timestamp, 'YYYY-MM-DD HH:mm:ss').isAfter(oneHourAgo)
    );
    
    // Emit real-time update via Socket.IO if available
    if (global.io) {
        global.io.emit('newRequest', {
            timestamp,
            macAddress: macAddress || 'No MAC',
            endpoint,
            ip: ip.substring(0, 10) + '...', // Partial IP for privacy
            platform,
            appType,
            method: req.method,
            totalRequests: global.monitoringStats.totalRequests,
            activeDevices: global.monitoringStats.activeDevices.size
        });
    }
    
    // Override res.end to capture response status
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        // Update the log entry with final status
        if (global.monitoringStats.logs.length > 0 && 
            global.monitoringStats.logs[0].timestamp === timestamp) {
            global.monitoringStats.logs[0].status = res.statusCode;
        }
        
        // Update the real-time log with status
        if (global.io) {
            global.io.emit('requestComplete', {
                timestamp,
                status: res.statusCode,
                macAddress: macAddress || 'No MAC',
                endpoint
            });
        }
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

module.exports = { trackRequest: global.trackRequest };