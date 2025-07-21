
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
        
        // Get start of today (00:00:00 of current day) and end of today (23:59:59)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        
        // Format dates as YYYY-MM-DD for pay_time field comparison
        const todayDateString = startOfToday.toISOString().split('T')[0];
        const monthStartDateString = startOfMonth.toISOString().split('T')[0];
        const currentDateString = now.toISOString().split('T')[0];

        // Use fixed price of €8.99 for all calculations
        const standardPrice = 8.99;

        // Get today's transactions count only (00:00 to 23:59 today)
        // Check for exact date match and date string starting with today's date
        const totalTransactions24h = await Transaction.countDocuments({
            $and: [
                {
                    $or: [
                        { pay_time: todayDateString },
                        { pay_time: { $regex: `^${todayDateString}` } }
                    ]
                },
                { status: 'success' }
            ]
        });
        
        console.log(`Today's date string: ${todayDateString}`);
        console.log(`Today's successful transaction count: ${totalTransactions24h}`);
        
        // Double check: count all transactions for today (including failed ones)
        const allTransactions24h = await Transaction.countDocuments({
            $or: [
                { pay_time: todayDateString },
                { pay_time: { $regex: `^${todayDateString}` } }
            ]
        });
        console.log(`Today's total transactions (all statuses): ${allTransactions24h}`);
        
        // Ensure we have a valid transaction count
        const safeTransactionCount24h = Number.isInteger(totalTransactions24h) ? totalTransactions24h : 0;
        
        // Calculate 24h revenue: transaction count × €8.99
        const revenue24h = safeTransactionCount24h * standardPrice;
        
        console.log(`Today's revenue calculation: ${safeTransactionCount24h} × ${standardPrice} = ${revenue24h}`);

        // Get monthly transactions count from start of month to current date
        // Create regex pattern for the current month (YYYY-MM-)
        const monthPattern = `^${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-`;
        
        const monthlyTransactionCount = await Transaction.countDocuments({
            $and: [
                {
                    $or: [
                        { 
                            pay_time: { 
                                $gte: monthStartDateString, 
                                $lte: currentDateString 
                            } 
                        },
                        { pay_time: { $regex: monthPattern } }
                    ]
                },
                { status: 'success' }
            ]
        });
        
        console.log(`Month pattern: ${monthPattern}`);
        console.log(`Monthly successful transaction count: ${monthlyTransactionCount}`);
        
        // Double check: count all monthly transactions (including failed ones)
        const allMonthlyTransactions = await Transaction.countDocuments({
            $or: [
                { 
                    pay_time: { 
                        $gte: monthStartDateString, 
                        $lte: currentDateString 
                    } 
                },
                { pay_time: { $regex: monthPattern } }
            ]
        });
        console.log(`Monthly total transactions (all statuses): ${allMonthlyTransactions}`);
        
        // Ensure we have a valid monthly transaction count
        const safeMonthlyTransactionCount = Number.isInteger(monthlyTransactionCount) ? monthlyTransactionCount : 0;
        
        // Calculate monthly revenue: transaction count × €8.99
        const monthlyRevenue = safeMonthlyTransactionCount * standardPrice;
        
        console.log(`Monthly revenue calculation: ${safeMonthlyTransactionCount} × ${standardPrice} = ${monthlyRevenue}`);

        // Get current timestamp as string for comparison
        const nowTimestamp = now.getTime().toString();

        // Run all device queries in parallel for better performance
        const [totalDevices, activeDevices, trialDevices, platformAggregation] = await Promise.all([
            Device.countDocuments({}),
            Device.countDocuments({
                $or: [
                    { expire_date: { $gte: currentDateString } },
                    { expire_date: { $gte: nowTimestamp } }
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

        // Ensure we have valid numbers before formatting
        const validRevenue24h = (!isNaN(revenue24h) && isFinite(revenue24h)) ? revenue24h : 0;
        const validMonthlyRevenue = (!isNaN(monthlyRevenue) && isFinite(monthlyRevenue)) ? monthlyRevenue : 0;

        const result = {
            totalTransactions24h: totalTransactions24h || 0,
            revenue24h: '€' + validRevenue24h.toFixed(2),
            totalDevices,
            activeDevices,
            trialDevices,
            monthlyRevenue: '€' + validMonthlyRevenue.toFixed(2),
            platformDistribution
        };
        
        console.log('Final result with validation:', result);
        console.log('Revenue validation - 24h:', { revenue24h, validRevenue24h, isNaN: isNaN(revenue24h), isFinite: isFinite(revenue24h) });
        console.log('Monthly validation:', { monthlyRevenue, validMonthlyRevenue, isNaN: isNaN(monthlyRevenue), isFinite: isFinite(monthlyRevenue) });

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
        const now = new Date();
        const todayDateString = now.toISOString().split('T')[0];
        const monthStartDateString = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString().split('T')[0];
        
        // Get today's transactions
        const todayTransactions = await Transaction.find({
            $or: [
                { pay_time: todayDateString },
                { pay_time: { $regex: `^${todayDateString}` } }
            ],
            status: 'success'
        }).select('pay_time status amount created_time');
        
        // Get this month's transactions
        const monthlyTransactions = await Transaction.find({
            $or: [
                { pay_time: { $gte: monthStartDateString, $lte: todayDateString } },
                { pay_time: { $regex: `^${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` } }
            ],
            status: 'success'
        }).select('pay_time status amount created_time');
        
        // Get sample transactions
        const sampleTransactions = await Transaction.find({}).limit(10).select('created_time pay_time status amount');
        
        // Get sample devices
        const sampleDevices = await Device.find({}).limit(5).select('created_time expire_date is_trial app_type');
        
        // Count all transactions
        const totalTransactions = await Transaction.countDocuments({});
        const successTransactions = await Transaction.countDocuments({ status: 'success' });
        
        // Count all devices
        const totalDevices = await Device.countDocuments({});
        
        const debugInfo = {
            todayDateString,
            monthStartDateString,
            todayTransactions,
            monthlyTransactions,
            sampleTransactions,
            sampleDevices,
            counts: {
                totalTransactions,
                successTransactions,
                totalDevices,
                todayTransactionsCount: todayTransactions.length,
                monthlyTransactionsCount: monthlyTransactions.length
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
