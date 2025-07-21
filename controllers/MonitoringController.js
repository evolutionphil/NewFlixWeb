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
        const now = moment();
        const today = now.format('YYYY-MM-DD');
        const yesterday = now.subtract(1, 'day').format('YYYY-MM-DD');

        // Get total devices
        const totalDevices = await Device.countDocuments({});

        // Get active devices (those with is_trial = 2)
        const activeDevices = await Device.countDocuments({ is_trial: 2 });

        // Get 24h transactions count
        const transactions24h = await Transaction.countDocuments({
            pay_time: {
                $gte: today + ' 00:00',
                $lte: today + ' 23:59'
            },
            status: 'success'
        });

        // Get platform distribution
        const platformDistribution = await Device.aggregate([
            {
                $group: {
                    _id: '$app_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get device status distribution
        const deviceStatus = await Device.aggregate([
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$is_trial', 2] },
                            then: 'Active',
                            else: 'Inactive'
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get monthly revenue for last 6 months
        const sixMonthsAgo = moment().subtract(6, 'months').format('YYYY-MM-DD');
        const monthlyRevenue = await Transaction.aggregate([
            {
                $match: {
                    pay_time: { $gte: sixMonthsAgo + ' 00:00' },
                    status: 'success'
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m',
                            date: {
                                $dateFromString: {
                                    dateString: '$pay_time'
                                }
                            }
                        }
                    },
                    revenue: { $sum: { $toDouble: '$amount' } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const stats = {
            totalDevices,
            activeDevices,
            transactions24h,
            platformDistribution,
            deviceStatus,
            monthlyRevenue
        };

        res.json(stats);
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

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