const moment = require('moment');

const Transaction = require('../models/Transaction.model');

async function calculateEarningsStats() {
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    const weekStart = moment().startOf('week');
    const monthStart = moment().startOf('month');

    const stats = {
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        allTime: 0,
        byPaymentMethod: {},
        byPlatform: {}
    };

    // Get total amount of transactions for category using aggregation facet
    let transactions = await Transaction.aggregate([
        { $match: { status: 'success' } },
        { $facet: {
            today: [{ $match: { pay_time: { $regex: today.format('YYYY-MM-DD') } } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }],
            yesterday: [{ $match: { pay_time: { $regex: yesterday.format('YYYY-MM-DD') } } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }],
            thisWeek: [{ $match: { pay_time: { $regex: weekStart.format('YYYY-MM-DD') } } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }],
            thisMonth: [{ $match: { pay_time: { $regex: monthStart.format('YYYY-MM-DD') } } }, { $group: { _id: '$status', total: { $sum: '$amount' } } }],
            allTime: [{ $group: { _id: '$status', total: { $sum: '$amount' } } }]
        } }
    ]);

    transactions = transactions.pop();

    // Extract the results from the aggregation
    const todaysTransactions = transactions.today.length > 0 ? transactions.today[0] : { _id: 'unknown', total: 0 };
    const yesterdayTransactions = transactions.yesterday.length > 0 ? transactions.yesterday[0] : { _id: 'unknown', total: 0 };
    const thisWeekTransactions = transactions.thisWeek.length > 0 ? transactions.thisWeek[0] : { _id: 'unknown', total: 0 };
    const thisMonthTransactions = transactions.thisMonth.length > 0 ? transactions.thisMonth[0] : { _id: 'unknown', total: 0 };
    const allTimeTransactions = transactions.allTime.length > 0 ? transactions.allTime[0] : { _id: 'unknown', total: 0 };

    // Round all numbers to 2 decimal places
    stats.today = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(todaysTransactions.total);
    stats.yesterday = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(yesterdayTransactions.total);
    stats.thisWeek = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(thisWeekTransactions.total);
    stats.thisMonth = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(thisMonthTransactions.total);
    stats.allTime = Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(allTimeTransactions.total);

    return stats;
}

exports.dashboard = async (req, res) => {
    const stats = await calculateEarningsStats();

    res.render('admin/pages/dashboard/index', {
        menu: 'dashboard',
        layout: './admin/partials/layout',
        user: req.user,
        stats: stats
    });
}