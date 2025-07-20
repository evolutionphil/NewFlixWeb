
const moment = require('moment');
const Device = require('../models/Device.model');
const Transaction = require('../models/Transaction.model');

// In-memory storage for real-time monitoring data
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
            const activatedDevices = await Device.countDocuments({ is_trial: 1 });
            
            // Get device registrations for today and yesterday
            const todayDevices = await Device.countDocuments({
                created_time: {
                    $gte: today.format('YYYY-MM-DD')
                }
            });
            
            const yesterdayDevices = await Device.countDocuments({
                created_time: {
                    $gte: yesterday.format('YYYY-MM-DD'),
                    $lt: today.format('YYYY-MM-DD')
                }
            });

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

            // Calculate percentage changes
            const devicesChange = yesterdayDevices > 0 
                ? Math.round(((todayDevices - yesterdayDevices) / yesterdayDevices) * 100)
                : 0;

            const transactionsChange = yesterdayTransactions > 0
                ? Math.round(((dailyTransactions - yesterdayTransactions) / yesterdayTransactions) * 100)
                : 0;

            // Get revenue data for last 6 months
            const revenueData = await this.getRevenueData();
            
            // Get registration data for last 7 days
            const registrationData = await this.getRegistrationData();
            
            // Get platform distribution
            const platformData = await this.getPlatformData();

            // Get MAC address statistics
            const macStats = this.getMacStats();

            const stats = {
                totalRequests: global.monitoringData.requestCounts.total,
                totalDevices,
                activatedDevices,
                dailyTransactions,
                requestsChange: 0, // Will be calculated based on stored data
                devicesChange,
                activatedChange: Math.round(((activatedDevices / totalDevices) * 100)) || 0,
                transactionsChange,
                revenue: revenueData,
                registrations: registrationData,
                platforms: platformData,
                macStats
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

class MonitoringController {
    // Main monitoring dashboard
    static async dashboard(req, res) {
        try {
            res.render('admin/pages/monitoring/index', {
                layout: 'admin/partials/layout',
                title: 'Real-time Monitoring Dashboard'
            });
        } catch (error) {
            console.error('Monitoring dashboard error:', error);
            res.status(500).send('Error loading monitoring dashboard');
        }
    }
    
    // Get current statistics
    static async getStats(req, res) {
        try {
            // Get 24h transactions
            const last24h = moment().subtract(24, 'hours');
            const transactions24h = await Transaction.countDocuments({
                createdAt: { $gte: last24h.toDate() },
                status: 'success'
            });
            
            // Get total devices
            const totalDevices = await Device.countDocuments();
            const activatedDevices = await Device.countDocuments({
                is_active: true
            });
            
            // Get monthly revenue (last 6 months)
            const monthlyRevenue = [];
            for (let i = 5; i >= 0; i--) {
                const startDate = moment().subtract(i, 'months').startOf('month');
                const endDate = moment().subtract(i, 'months').endOf('month');
                
                const revenue = await Transaction.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
                            status: 'success'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $toDouble: '$price' } }
                        }
                    }
                ]);
                
                monthlyRevenue.push({
                    month: startDate.format('MMM YYYY'),
                    revenue: revenue.length > 0 ? revenue[0].total : 0
                });
            }
            
            // Get daily registrations (last 7 days)
            const dailyRegistrations = [];
            for (let i = 6; i >= 0; i--) {
                const date = moment().subtract(i, 'days').startOf('day');
                const nextDate = moment().subtract(i, 'days').endOf('day');
                
                const count = await Device.countDocuments({
                    createdAt: { $gte: date.toDate(), $lte: nextDate.toDate() }
                });
                
                dailyRegistrations.push({
                    date: date.format('MMM DD'),
                    count: count
                });
            }
            
            // Convert MAC stats to array format
            const macStatsArray = Array.from(global.monitoringStats.macStats.entries()).map(([mac, stats]) => ({
                macAddress: mac,
                totalRequests: stats.totalRequests,
                ipAddresses: Array.from(stats.ipAddresses),
                firstRequest: stats.firstRequest,
                lastRequest: stats.lastRequest,
                endpoints: Array.from(stats.endpoints)
            })).sort((a, b) => b.totalRequests - a.totalRequests);
            
            const response = {
                totalDevices,
                activatedDevices,
                last24hTransactions: transactions24h,
                totalRequests: global.monitoringStats.totalRequests,
                activeDevices: global.monitoringStats.activeDevices.size,
                platformDistribution: global.monitoringStats.platformDistribution,
                monthlyRevenue,
                dailyRegistrations,
                macStats: macStatsArray.slice(0, 100), // Top 100 MACs
                recentLogs: global.monitoringStats.logs.slice(0, 100) // Last 100 logs
            };
            
            res.json(response);
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    }
    
    // Block a MAC address
    static async blockMac(req, res) {
        try {
            const { macAddress, reason } = req.body;
            
            if (!macAddress) {
                return res.status(400).json({ error: 'MAC address is required' });
            }
            
            // Add to blocked MAC addresses
            global.blocked_mac_address[macAddress] = {
                reason: reason || 'Blocked via monitoring dashboard',
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            };
            
            // Remove from active devices
            global.monitoringStats.activeDevices.delete(macAddress);
            
            // Remove from MAC stats
            global.monitoringStats.macStats.delete(macAddress);
            
            res.json({ success: true, message: 'MAC address blocked successfully' });
        } catch (error) {
            console.error('Block MAC error:', error);
            res.status(500).json({ error: 'Failed to block MAC address' });
        }
    }
    
    // Get detailed info for a specific MAC address
    static async getMacDetails(req, res) {
        try {
            const { macAddress } = req.params;
            
            const macStats = global.monitoringStats.macStats.get(macAddress);
            if (!macStats) {
                return res.status(404).json({ error: 'MAC address not found in current session' });
            }
            
            // Get device info from database
            const device = await Device.findOne({ mac_address: macAddress });
            
            // Get transaction history
            const transactions = await Transaction.find({ mac_address: macAddress })
                .sort({ createdAt: -1 })
                .limit(10);
            
            // Filter logs for this MAC
            const macLogs = global.monitoringStats.logs.filter(log => log.macAddress === macAddress);
            
            res.json({
                macAddress,
                stats: {
                    ...macStats,
                    ipAddresses: Array.from(macStats.ipAddresses),
                    endpoints: Array.from(macStats.endpoints)
                },
                device,
                transactions,
                logs: macLogs.slice(0, 50) // Last 50 logs for this MAC
            });
        } catch (error) {
            console.error('Get MAC details error:', error);
            res.status(500).json({ error: 'Failed to get MAC details' });
        }
    }
}

module.exports = MonitoringController;
