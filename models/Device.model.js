const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let DeviceModel = new Schema({
    mac_address:{
        type:String
    },
    expire_date:{
        type:String
    },
    is_trial:{
        type:Number,
        default:0, // 0=> Trial, 1=>Activated
    },
    app_type:String,
    version:String,
    parent_pin:String,
    lock:{
        type:Number,
        default:0
    },
    created_time:String,
    ip:String
});
module.exports = mongoose.model('Device', DeviceModel);
