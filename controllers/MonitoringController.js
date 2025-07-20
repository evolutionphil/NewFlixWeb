const moment = require('moment');
const Device = require('../models/Device.model');
const Transaction = require('../models/Transaction.model');

// Helper functions
function getClientIPAddress(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           '0.0.0.0';
}

function getUserAgent(req) {
    return req.headers['user-agent'] || 'Unknown';
}

// In-memory storage for real-time monitoring data
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

class MonitoringController {
    // Get main monitoring dashboard
    static async dashboard(req, res) {
        try {
            res.render('admin/pages/monitoring/index', {
                menu: 'monitoring',
                layout: './admin/partials/layout',
                user: req.user
            });
        } catch (error) {
            console.error('Monitoring dashboard error:', error);
            res.status(500).send('Internal server error');
        }
    }

    // Get monitoring statistics API
    static async getStats(req, res) {
        try {
            const today = moment().startOf('day');
            const yesterday = moment().subtract(1, 'day').startOf('day');

            // Get device statistics
            const totalDevices = await Device.countDocuments();
            const activatedDevices = await Device.countDocuments({ is_trial: 2 });


            // Get transaction statistics
            const dailyTransactions = await Transaction.countDocuments({
                pay_time: {
                    $gte: today.format('YYYY-MM-DD')
                },
                status: 'success'
            });

            const yesterdayTransactions = await Transaction.countDocuments({
                pay_time: {
                    $gte: yesterday.format('YYYY-MM-DD'),
                    $lt: today.format('YYYY-MM-DD')
                },
                status: 'success'
            });

            // Get activated devices for yesterday to calculate change
            const yesterdayActivatedDevices = await Device.countDocuments({
                is_trial: 2,
                created_time: {
                    $gte: yesterday.format('YYYY-MM-DD'),
                    $lt: today.format('YYYY-MM-DD')
                }
            });

            // Calculate percentage changes
            const devicesChange = yesterdayDevices > 0 
                ? Math.round(((todayDevices - yesterdayDevices) / yesterdayDevices) * 100)
                : 0;

            const activatedChange = yesterdayActivatedDevices > 0
                ? Math.round(((activatedDevices - yesterdayActivatedDevices) / yesterdayActivatedDevices) * 100)
                : activatedDevices > 0 ? 100 : 0;

            const transactionsChange = yesterdayTransactions > 0
                ? Math.round(((dailyTransactions - yesterdayTransactions) / yesterdayTransactions) * 100)
                : 0;

            // Get revenue data for last 6 months
            const revenueData = await MonitoringController.getRevenueData();

            // Get registration data for last 7 days
            const registrationData = await MonitoringController.getRegistrationData();

            // Get platform distribution
            const platformData = await MonitoringController.getPlatformData();

            // Get MAC address statistics
            const macStats = MonitoringController.getMacStats();

            const stats = {
                totalRequests: global.monitoringData.requestCounts.total,
                totalDevices,
                activatedDevices,
                dailyTransactions,
                requestsChange: 0, // Will be calculated based on stored data
                devicesChange,
                activatedChange,
                transactionsChange,
                revenue: revenueData,
                registrations: registrationData,
                platforms: platformData,
                macStats,
                realtimeLogs: global.monitoringData.realtimeLogs.slice(0, 50)
            };

            res.json(stats);
        } catch (error) {
            console.error('Error getting monitoring stats:', error);
            res.status(500).json({ error: 'Failed to get monitoring statistics' });
        }
    }

    // Get revenue data for last 6 months
    static async getRevenueData() {
        try {
            const months = [];
            const data = [];

            for (let i = 5; i >= 0; i--) {
                const monthStart = moment().subtract(i, 'months').startOf('month');
                const monthEnd = moment().subtract(i, 'months').endOf('month');

                const revenue = await Transaction.aggregate([
                    {
                        $match: {
                            pay_time: {
                                $gte: monthStart.format('YYYY-MM-DD'),
                                $lte: monthEnd.format('YYYY-MM-DD')
                            },
                            status: 'success'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$amount' }
                        }
                    }
                ]);

                months.push(monthStart.format('MMM YYYY'));
                data.push(revenue.length > 0 ? revenue[0].total : 0);
            }

            return { labels: months, data };
        } catch (error) {
            console.error('Error getting revenue data:', error);
            return { labels: [], data: [] };
        }
    }

    // Get registration data for last 7 days
    static async getRegistrationData() {
        try {
            const days = [];
            const data = [];

            for (let i = 6; i >= 0; i--) {
                const day = moment().subtract(i, 'days');
                const dayStart = day.startOf('day').format('YYYY-MM-DD');

                const registrations = await Device.countDocuments({
                    created_time: dayStart
                });

                days.push(day.format('MMM DD'));
                data.push(registrations);
            }

            return { labels: days, data };
        } catch (error) {
            console.error('Error getting registration data:', error);
            return { labels: [], data: [] };
        }
    }

    // Get platform distribution data
    static async getPlatformData() {
        try {
            const platforms = await Device.aggregate([
                {
                    $group: {
                        _id: '$app_type',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);

            const labels = [];
            const data = [];

            platforms.forEach(platform => {
                labels.push(platform._id || 'Unknown');
                data.push(platform.count);
            });

            return { labels, data };
        } catch (error) {
            console.error('Error getting platform data:', error);
            return { labels: [], data: [] };
        }
    }

    // Get MAC address statistics from in-memory data
    static getMacStats() {
        const stats = [];

        for (const [macAddress, data] of global.monitoringData.macStats.entries()) {
            stats.push({
                macAddress,
                totalRequests: data.requests,
                ipCount: data.ips.size,
                firstRequest: data.firstRequest,
                lastRequest: data.lastRequest
            });
        }

        // Sort by total requests (descending)
        return stats.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 50);
    }

    // Block MAC address
    static async blockMac(req, res) {
        try {
            const { macAddress } = req.body;

            if (!macAddress) {
                return res.status(400).json({ success: false, error: 'MAC address is required' });
            }

            // Add to blocked MAC addresses
            if (!global.blocked_mac_address) {
                global.blocked_mac_address = {};
            }

            global.blocked_mac_address[macAddress] = {
                reason: 'Blocked from monitoring dashboard',
                blocked_at: moment().utc().format('Y-MM-DD HH:mm:ss')
            };

            res.json({ success: true, message: 'MAC address blocked successfully' });
        } catch (error) {
            console.error('Error blocking MAC address:', error);
            res.status(500).json({ success: false, error: 'Failed to block MAC address' });
        }
    }

    // Get detailed MAC address information
    static async getMacDetails(req, res) {
        try {
            const { macAddress } = req.params;

            const macData = global.monitoringData.macStats.get(macAddress);

            if (!macData) {
                return res.status(404).json({ error: 'MAC address not found' });
            }

            // Get device information from database
            const device = await Device.findOne({ mac_address: macAddress });

            // Get transaction history
            const transactions = await Transaction.find({ mac_address: macAddress })
                .sort({ pay_time: -1 })
                .limit(10);

            const details = {
                macAddress,
                requests: macData.requests,
                ips: Array.from(macData.ips),
                firstRequest: macData.firstRequest,
                lastRequest: macData.lastRequest,
                endpoints: Array.from(macData.endpoints || []),
                device,
                transactions
            };

            res.json(details);
        } catch (error) {
            console.error('Error getting MAC details:', error);
            res.status(500).json({ error: 'Failed to get MAC address details' });
        }
    }
}

// Middleware to track API requests
global.trackRequest = function(req, res, next) {
    const ip = getClientIPAddress(req);
    const userAgent = getUserAgent(req);
    const endpoint = req.originalUrl;
    const macAddress = req.body.mac_address || req.query.mac_address || req.headers['x-mac-address'];

    // Update global request counter
    global.monitoringData.requestCounts.total++;

    // Track today's requests
    const today = moment().format('YYYY-MM-DD');
    if (!global.monitoringData.dailyStats.has(today)) {
        global.monitoringData.dailyStats.set(today, { requests: 0 });
    }
    global.monitoringData.dailyStats.get(today).requests++;

    // Track MAC address statistics
    if (macAddress) {
        if (!global.monitoringData.macStats.has(macAddress)) {
            global.monitoringData.macStats.set(macAddress, {
                requests: 0,
                ips: new Set(),
                endpoints: new Set(),
                firstRequest: new Date().toISOString(),
                lastRequest: new Date().toISOString()
            });
        }

        const macData = global.monitoringData.macStats.get(macAddress);
        macData.requests++;
        macData.ips.add(ip);
        macData.endpoints.add(endpoint);
        macData.lastRequest = new Date().toISOString();
    }

    // Create log entry
    const logEntry = {
        timestamp: new Date().toISOString(),
        macAddress: macAddress || null,
        endpoint,
        ip,
        userAgent,
        status: 200 // Will be updated after response
    };

    // Store the log entry for later status update
    res.locals.logEntry = logEntry;

    // Override res.end to capture status code
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        logEntry.status = res.statusCode;

        // Add to real-time logs (keep only last 1000 entries)
        global.monitoringData.realtimeLogs.unshift(logEntry);
        if (global.monitoringData.realtimeLogs.length > 1000) {
            global.monitoringData.realtimeLogs = global.monitoringData.realtimeLogs.slice(0, 1000);
        }

        // Emit to connected clients if socket.io is available
        if (global.io) {
            global.io.emit('new-request', logEntry);
        }

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

module.exports = MonitoringController;