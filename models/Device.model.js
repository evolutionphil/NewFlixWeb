const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let DeviceModel = new Schema({
    mac_address:{
        type:String,
        index: true
    },
    expire_date:{
        type:String
    },
    is_trial:{
        type:Number,
        default:0, // 0=> Trial, 1=>Activated
        index: true
    },
    registered_from_domain:{
        type:String,
        default: null
    },
    app_type:{
        type:String,
        index: true
    },
    version:String,
    parent_pin:String,
    lock:{
        type:Number,
        default:0
    },
    created_time:{
        type:String,
        index: true
    },
    last_used_at: {
        type: Date,
        default: null,
        index: true
    },
    ip:String
});

// Add compound indexes for better query performance
DeviceModel.index({ mac_address: 1, is_trial: 1 });
DeviceModel.index({ created_time: 1, is_trial: 1 });
DeviceModel.index({ last_used_at: 1, is_trial: 1 });

module.exports = mongoose.model('Device', DeviceModel);
