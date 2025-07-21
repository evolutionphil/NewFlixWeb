
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
        
        // Get start of today (00:00:00 of current day)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        
        // Convert dates to different formats for comparison
        const startOfTodayTimestamp = startOfToday.getTime().toString();
        const startOfMonthTimestamp = startOfMonth.getTime().toString();
        const nowTimestamp = now.getTime().toString();
        
        // Format dates as YYYY-MM-DD for pay_time field comparison
        const todayDateString = startOfToday.toISOString().split('T')[0];
        const monthStartDateString = startOfMonth.toISOString().split('T')[0];

        console.log('Date calculations:', {
            now: now.toISOString(),
            startOfToday: startOfToday.toISOString(),
            startOfMonth: startOfMonth.toISOString(),
            todayDateString,
            monthStartDateString
        });

        // Get today's transactions (from 00:00 to current time) - check both created_time and pay_time fields
        const transactions24hQuery = {
            $or: [
                { created_time: { $gte: startOfTodayTimestamp } },
                { pay_time: { $gte: todayDateString } }
            ],
            status: 'success'
        };
        
        const transactions24h = await Transaction.find(transactions24hQuery).select('amount created_time pay_time');
        console.log('Today transactions found:', transactions24h.length);
        
        const totalTransactions24h = transactions24h.length;
        const revenue24h = transactions24h.reduce((sum, t) => {
            return sum + (parseFloat(t.amount) || 0);
        }, 0);

        // Get monthly transactions with revenue (from start of month to now)
        const monthlyTransactionsQuery = {
            $or: [
                { created_time: { $gte: startOfMonthTimestamp } },
                { pay_time: { $gte: monthStartDateString } }
            ],
            status: 'success'
        };
        
        const monthlyTransactions = await Transaction.find(monthlyTransactionsQuery).select('amount created_time pay_time');
        console.log('Monthly transactions found:', monthlyTransactions.length);
        
        // Debug: Show breakdown of transaction amounts
        const amountBreakdown = {};
        monthlyTransactions.forEach(t => {
            const amount = parseFloat(t.amount) || 0;
            if (amountBreakdown[amount]) {
                amountBreakdown[amount]++;
            } else {
                amountBreakdown[amount] = 1;
            }
        });
        console.log('Monthly transaction amount breakdown:', amountBreakdown);
        
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
