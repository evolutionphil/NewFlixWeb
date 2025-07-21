
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

        // Use a fixed price of 8.99 for calculations as requested
        const STANDARD_PRICE = 8.99;

        // Get today's transactions count only (optimized for performance)
        const totalTransactions24h = await Transaction.countDocuments({
            $or: [
                { created_time: { $gte: startOfTodayTimestamp } },
                { pay_time: { $gte: todayDateString } }
            ],
            status: 'success'
        });
        
        // Calculate 24h revenue using standard price
        const revenue24h = totalTransactions24h * STANDARD_PRICE;

        // Get monthly transactions count (optimized for performance)
        const monthlyTransactionCount = await Transaction.countDocuments({
            $or: [
                { created_time: { $gte: startOfMonthTimestamp } },
                { pay_time: { $gte: monthStartDateString } }
            ],
            status: 'success'
        });
        
        // Calculate monthly revenue using standard price
        const monthlyRevenue = monthlyTransactionCount * STANDARD_PRICE;

        // Run all device queries in parallel for better performance
        const [totalDevices, activeDevices, trialDevices, platformAggregation] = await Promise.all([
            Device.countDocuments({}),
            Device.countDocuments({
                $or: [
                    { expire_date: { $gte: nowTimestamp } },
                    { expire_date: { $gte: now.getTime() } }
                ],
                is_trial: 2  // 2 means activated
            }),
            Device.countDocuments({
                is_trial: 1  // 1 means trial
            }),
            Device.aggregate([
                {
                    $group: {
                        _id: '$app_type',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Process platform distribution from aggregation
        const platformDistribution = {
            android: 0,
            iOS: 0,
            samsung: 0,
            lg: 0,
            tvOS: 0,
            other: 0
        };

        platformAggregation.forEach(item => {
            const appType = (item._id || '').toLowerCase();
            const count = item.count;
            
            if (appType.includes('android')) {
                platformDistribution.android += count;
            } else if (appType.includes('ios') || appType.includes('apple')) {
                platformDistribution.iOS += count;
            } else if (appType.includes('samsung') || appType.includes('tizen')) {
                platformDistribution.samsung += count;
            } else if (appType.includes('lg') || appType.includes('webos')) {
                platformDistribution.lg += count;
            } else if (appType.includes('tvos') || appType.includes('appletv')) {
                platformDistribution.tvOS += count;
            } else {
                platformDistribution.other += count;
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

// Removed Socket.IO functionality - monitoring now uses regular HTTP requests

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
