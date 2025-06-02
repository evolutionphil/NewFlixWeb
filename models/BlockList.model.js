const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let BlockList = new Schema({
    type: {
        type: String,
        enum: ['mac_address', 'ip_address'],
        required: true,
    },
    value: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    cloudflare_id: {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BlockList', BlockList);
