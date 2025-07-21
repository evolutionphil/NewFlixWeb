const getStats = async () => {
    try {
        const moment = require('moment');
        const today = moment();
        const yesterday = moment().subtract(1, 'day');

        // Get 24h transactions
        const totalTransactions24h = await Transaction.countDocuments({
            pay_time: {
                $gte: yesterday.format('YYYY-MM-DD HH:mm'),
                $lte: today.format('YYYY-MM-DD HH:mm')
            },
            status: 'success'
        });

        // Get total devices
        const totalDevices = await Device.countDocuments({});

        // Get active devices (those with is_trial = 2)
        const activeDevices = await Device.countDocuments({
            is_trial: 2
        });

        // Get this month's revenue
        const monthStart = moment().startOf('month');
        const monthlyRevenue = await Transaction.aggregate([
            {
                $match: {
                    pay_time: { $gte: monthStart.format('YYYY-MM-DD') },
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

        // Get platform distribution
        const platformDistribution = await Device.aggregate([
            {
                $group: {
                    _id: '$app_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const platformData = {};
        platformDistribution.forEach(item => {
            if (item._id) {
                platformData[item._id] = item.count;
            }
        });

        // Get device status distribution
        const deviceStatusData = await Device.aggregate([
            {
                $group: {
                    _id: '$is_trial',
                    count: { $sum: 1 }
                }
            }
        ]);

        const deviceStatus = {
            active: 0,
            trial: 0,
            inactive: 0
        };

        deviceStatusData.forEach(item => {
            if (item._id === 2) deviceStatus.active = item.count;
            else if (item._id === 0) deviceStatus.trial = item.count;
            else deviceStatus.inactive = item.count;
        });

        // Get hourly transactions for last 24 hours
        const hourlyTransactions = new Array(24).fill(0);
        const hourlyData = await Transaction.aggregate([
            {
                $match: {
                    pay_time: {
                        $gte: yesterday.format('YYYY-MM-DD HH:mm'),
                        $lte: today.format('YYYY-MM-DD HH:mm')
                    },
                    status: 'success'
                }
            },
            {
                $addFields: {
                    hour: {
                        $toInt: {
                            $substr: ['$pay_time', 11, 2]
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$hour',
                    count: { $sum: 1 }
                }
            }
        ]);

        hourlyData.forEach(item => {
            if (item._id >= 0 && item._id < 24) {
                hourlyTransactions[item._id] = item.count;
            }
        });

        // Get monthly revenue for last 6 months
        const monthlyRevenueData = {
            labels: [],
            data: []
        };

        for (let i = 5; i >= 0; i--) {
            const monthDate = moment().subtract(i, 'months');
            const monthStart = monthDate.startOf('month').format('YYYY-MM-DD');
            const monthEnd = monthDate.endOf('month').format('YYYY-MM-DD');

            const revenue = await Transaction.aggregate([
                {
                    $match: {
                        pay_time: {
                            $gte: monthStart,
                            $lte: monthEnd
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

            monthlyRevenueData.labels.push(monthDate.format('MMM YYYY'));
            monthlyRevenueData.data.push(revenue.length > 0 ? revenue[0].total : 0);
        }

        return {
            totalTransactions24h,
            totalDevices,
            activeDevices,
            monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
            platformDistribution: platformData,
            deviceStatus,
            hourlyTransactions,
            monthlyRevenueData
        };
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        throw error;
    }
};

exports.getMonitoringStats = async (req, res) => {
    try {
        const stats = await getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting monitoring stats:', error);
        res.status(500).json({ error: 'Internal server error' });
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
                const stats = await getStats();
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