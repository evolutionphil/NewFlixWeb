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
        // Get 24h transactions
        const yesterday = moment().subtract(1, 'day').toDate();
        const totalTransactions24h = await Transaction.countDocuments({
            pay_time: { $gte: yesterday },
            status: 'success'
        });

        // Get total devices
        const totalDevices = await Device.countDocuments({});

        // Get active devices (devices with expire_date in future)
        const now = new Date();
        const activeDevices = await Device.countDocuments({
            expire_date: { $gte: now }
        });

        // Get this month's revenue
        const startOfMonth = moment().startOf('month').toDate();
        const monthlyTransactions = await Transaction.find({
            pay_time: { $gte: startOfMonth },
            status: 'success'
        });
        const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

        // Platform distribution
        const devices = await Device.find({});
        const platformDistribution = {
            android: 0,
            iOS: 0,
            samsung: 0,
            lg: 0,
            tvOS: 0,
            macOS: 0
        };

        devices.forEach(device => {
            const userAgent = (device.user_agent || '').toLowerCase();
            if (userAgent.includes('android')) platformDistribution.android++;
            else if (userAgent.includes('ios') || userAgent.includes('iphone')) platformDistribution.iOS++;
            else if (userAgent.includes('samsung') || userAgent.includes('tizen')) platformDistribution.samsung++;
            else if (userAgent.includes('lg') || userAgent.includes('webos')) platformDistribution.lg++;
            else if (userAgent.includes('tvos') || userAgent.includes('apple tv')) platformDistribution.tvOS++;
            else if (userAgent.includes('mac')) platformDistribution.macOS++;
        });

        // Device status
        const trialDevices = await Device.countDocuments({
            expire_date: { $gte: now },
            status: 'trial'
        });
        const inactiveDevices = await Device.countDocuments({
            expire_date: { $lt: now }
        });

        const deviceStatus = {
            active: activeDevices - trialDevices,
            trial: trialDevices,
            inactive: inactiveDevices
        };

        // Hourly transactions for last 24 hours
        const hourlyTransactions = new Array(24).fill(0);
        const last24Hours = await Transaction.find({
            pay_time: { $gte: yesterday },
            status: 'success'
        });

        last24Hours.forEach(transaction => {
            const hour = moment(transaction.pay_time).hour();
            hourlyTransactions[hour]++;
        });

        // Monthly revenue for last 6 months
        const monthlyRevenueData = {
            labels: [],
            data: []
        };

        for (let i = 5; i >= 0; i--) {
            const monthStart = moment().subtract(i, 'month').startOf('month').toDate();
            const monthEnd = moment().subtract(i, 'month').endOf('month').toDate();
            const monthName = moment().subtract(i, 'month').format('MMM YYYY');

            const monthTransactions = await Transaction.find({
                pay_time: { $gte: monthStart, $lte: monthEnd },
                status: 'success'
            });

            const monthRevenue = monthTransactions.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

            monthlyRevenueData.labels.push(monthName);
            monthlyRevenueData.data.push(monthRevenue);
        }

        return {
            totalTransactions24h,
            totalDevices,
            activeDevices,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            platformDistribution,
            deviceStatus,
            hourlyTransactions,
            monthlyRevenueData
        };

    } catch (error) {
        console.error('Error in getMonitoringData:', error);
        return {
            totalTransactions24h: 0,
            totalDevices: 0,
            activeDevices: 0,
            monthlyRevenue: 0,
            platformDistribution: { android: 0, iOS: 0, samsung: 0, lg: 0, tvOS: 0, macOS: 0 },
            deviceStatus: { active: 0, trial: 0, inactive: 0 },
            hourlyTransactions: new Array(24).fill(0),
            monthlyRevenueData: { labels: [], data: [] }
        };
    }
}

exports.handleSocketConnection = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected to monitoring dashboard');

        socket.on('disconnect', () => {
            console.log('Client disconnected from monitoring dashboard');
        });

        // Send stats every 30 seconds
        const statsInterval = setInterval(async () => {
            try {
                const stats = await exports.getMonitoringStats();
                socket.emit('monitoringStats', stats);
            } catch (error) {
                console.error('Error sending stats:', error);
            }
        }, 30000);

        socket.on('disconnect', () => {
            clearInterval(statsInterval);
        });
    });
};