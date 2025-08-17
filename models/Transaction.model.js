const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let Transaction = new Schema({
    device_id: {
        type: String,
        required: true
    },
    mac_address: {
        type: String,
        required: false
    },
    app_type: {
        type: String,
        required: false
    },
    payment_type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    pay_time: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: false
    },
    ip: {
        type: String,
        required: false
    },
    user_agent: {
        type: String,
        required: false
    },
    payment_id: {
        type: String,
        required: false
    },
    created_time: {
        type: String,
        required: false
    },
    // Admin activation tracking fields
    admin_activation_ip: {
        type: String,
        required: false
    },
    admin_activation_domain: {
        type: String,
        required: false
    },
    admin_activation_url: {
        type: String,
        required: false
    },
    admin_activation_source: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('Transaction', Transaction);