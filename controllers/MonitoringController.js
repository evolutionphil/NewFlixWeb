
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
        // Get 24h transactions - using proper date comparison
        const yesterday = moment().subtract(24, 'hours').toDate();
        const totalTransactions24h = await Transaction.countDocuments({
            created_time: { $gte: yesterday.getTime().toString() },
            status: 'success'
        });

        // Get total devices
        const totalDevices = await Device.countDocuments({});

        // Get active devices (devices that are activated and not expired)
        const now = new Date();
        const activeDevices = await Device.countDocuments({
            expire_date: { $gte: now.getTime().toString() },
            is_trial: 2  // 2 means activated
        });

        // Get trial devices (devices that are in trial)
        const trialDevices = await Device.countDocuments({
            is_trial: 1  // 1 means trial
        });

        // Get this month's revenue
        const startOfMonth = moment().startOf('month').toDate();
        const monthlyTransactions = await Transaction.find({
            created_time: { $gte: startOfMonth.getTime().toString() },
            status: 'success'
        }).select('amount');
        
        const monthlyRevenue = monthlyTransactions.reduce((sum, t) => {
            return sum + (parseFloat(t.amount) || 0);
        }, 0);

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

        

        return {
            totalTransactions24h,
            totalDevices,
            activeDevices,
            trialDevices,
            monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
            platformDistribution
        };

    } catch (error) {
        console.error('Error in getMonitoringData:', error);
        return {
            totalTransactions24h: 0,
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

// Export the getMonitoringData function for testing
exports.getMonitoringData = getMonitoringData;
