
const Device = require('../models/Device.model');
const Transaction = require('../models/Transaction.model');
const moment = require('moment');

// Get monitoring dashboard
exports.index = async (req, res) => {
    try {
        res.render('admin/pages/monitoring/index', {
            menu: 'monitoring',
            layout: './admin/partials/layout'
        });
    } catch (error) {
        console.error('Error rendering monitoring page:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Get monitoring statistics
exports.getMonitoringStats = async (req, res) => {
    try {
        // Get monitoring statistics
        const stats = await getMonitoringData();
        res.json(stats);
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        res.status(500).json({ error: 'Failed to get monitoring stats' });
    }
};

async function getMonitoringData() {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Convert dates to timestamp strings for comparison - using milliseconds
        const yesterdayTimestamp = yesterday.getTime().toString();
        const startOfMonthTimestamp = startOfMonth.getTime().toString();
        const nowTimestamp = now.getTime().toString();

        console.log('Date calculations:', {
            now: now.toISOString(),
            yesterday: yesterday.toISOString(),
            startOfMonth: startOfMonth.toISOString(),
            yesterdayTimestamp,
            startOfMonthTimestamp
        });

        // Get 24h transactions with revenue - check both created_time and pay_time fields
        const transactions24hQuery = {
            $or: [
                { created_time: { $gte: yesterdayTimestamp } },
                { pay_time: { $gte: yesterday.toISOString().split('T')[0] } }
            ],
            status: 'success'
        };
        
        const transactions24h = await Transaction.find(transactions24hQuery).select('amount created_time pay_time');
        console.log('24h transactions found:', transactions24h.length);
        
        const totalTransactions24h = transactions24h.length;
        const revenue24h = transactions24h.reduce((sum, t) => {
            return sum + (parseFloat(t.amount) || 0);
        }, 0);

        // Get monthly transactions with revenue
        const monthlyTransactionsQuery = {
            $or: [
                { created_time: { $gte: startOfMonthTimestamp } },
                { pay_time: { $gte: startOfMonth.toISOString().split('T')[0] } }
            ],
            status: 'success'
        };
        
        const monthlyTransactions = await Transaction.find(monthlyTransactionsQuery).select('amount');
        console.log('Monthly transactions found:', monthlyTransactions.length);
        
        const monthlyRevenue = monthlyTransactions.reduce((sum, t) => {
            return sum + (parseFloat(t.amount) || 0);
        }, 0);

        // Get total devices
        const totalDevices = await Device.countDocuments({});
        console.log('Total devices:', totalDevices);

        // Get active devices (devices that are activated and not expired)
        const activeDevices = await Device.countDocuments({
            $or: [
                { expire_date: { $gte: nowTimestamp } },
                { expire_date: { $gte: now.getTime() } }
            ],
            is_trial: 2  // 2 means activated
        });
        console.log('Active devices:', activeDevices);

        // Get trial devices (devices that are in trial)
        const trialDevices = await Device.countDocuments({
            is_trial: 1  // 1 means trial
        });
        console.log('Trial devices:', trialDevices);

        // Get 24h activated devices (devices activated in last 24 hours)
        const activatedDevices24h = await Device.countDocuments({
            $or: [
                { created_time: { $gte: yesterdayTimestamp } },
                { created_time: { $gte: yesterday.getTime() } }
            ],
            is_trial: 2  // 2 means activated
        });
        console.log('24h activated devices:', activatedDevices24h);

        // Platform distribution - check app_type field
        const devices = await Device.find({}).select('app_type');
        const platformDistribution = {
            android: 0,
            iOS: 0,
            samsung: 0,
            lg: 0,
            tvOS: 0,
            other: 0
        };

        devices.forEach(device => {
            const appType = (device.app_type || '').toLowerCase();
            if (appType.includes('android')) {
                platformDistribution.android++;
            } else if (appType.includes('ios') || appType.includes('apple')) {
                platformDistribution.iOS++;
            } else if (appType.includes('samsung') || appType.includes('tizen')) {
                platformDistribution.samsung++;
            } else if (appType.includes('lg') || appType.includes('webos')) {
                platformDistribution.lg++;
            } else if (appType.includes('tvos') || appType.includes('appletv')) {
                platformDistribution.tvOS++;
            } else {
                platformDistribution.other++;
            }
        });

        const result = {
            totalTransactions24h,
            revenue24h: Math.round(revenue24h * 100) / 100,
            totalDevices,
            activeDevices,
            trialDevices,
            activatedDevices24h,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            platformDistribution
        };

        console.log('Final monitoring stats:', result);
        return result;

    } catch (error) {
        console.error('Error in getMonitoringData:', error);
        return {
            totalTransactions24h: 0,
            revenue24h: 0,
            totalDevices: 0,
            activeDevices: 0,
            trialDevices: 0,
            activatedDevices24h: 0,
            monthlyRevenue: 0,
            platformDistribution: { android: 0, iOS: 0, samsung: 0, lg: 0, tvOS: 0, other: 0 }
        };
    }
}

// Socket connection handler
exports.handleSocketConnection = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected to monitoring dashboard');

        // Send initial stats immediately
        getMonitoringData().then(stats => {
            socket.emit('monitoringStats', stats);
        }).catch(error => {
            console.error('Error sending initial stats:', error);
            socket.emit('monitoringStats', {
                totalTransactions24h: 0,
                revenue24h: 0,
                totalDevices: 0,
                activeDevices: 0,
                trialDevices: 0,
                activatedDevices24h: 0,
                monthlyRevenue: 0,
                platformDistribution: { android: 0, iOS: 0, samsung: 0, lg: 0, tvOS: 0, other: 0 }
            });
        });

        // Send stats every 30 seconds
        const statsInterval = setInterval(async () => {
            try {
                const stats = await getMonitoringData();
                socket.emit('monitoringStats', stats);
            } catch (error) {
                console.error('Error sending periodic stats:', error);
            }
        }, 30000);

        socket.on('disconnect', () => {
            console.log('Client disconnected from monitoring dashboard');
            clearInterval(statsInterval);
        });
    });
};

// Debug function to check database data
exports.debugData = async (req, res) => {
    try {
        // Get sample transactions
        const sampleTransactions = await Transaction.find({}).limit(5).select('created_time pay_time status amount');
        
        // Get sample devices
        const sampleDevices = await Device.find({}).limit(5).select('created_time expire_date is_trial app_type');
        
        // Count all transactions
        const totalTransactions = await Transaction.countDocuments({});
        const successTransactions = await Transaction.countDocuments({ status: 'success' });
        
        // Count all devices
        const totalDevices = await Device.countDocuments({});
        
        const debugInfo = {
            sampleTransactions,
            sampleDevices,
            counts: {
                totalTransactions,
                successTransactions,
                totalDevices
            },
            currentTime: new Date().toISOString(),
            currentTimestamp: new Date().getTime().toString()
        };
        
        res.json(debugInfo);
    } catch (error) {
        console.error('Debug data error:', error);
        res.status(500).json({ error: 'Failed to get debug data' });
    }
};

// Export the getMonitoringData function for testing
exports.getMonitoringData = getMonitoringData;
