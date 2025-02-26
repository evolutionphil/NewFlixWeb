const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let DeviceModel = new Schema({
    mac_address:{
        type:String,
        unique: true
    },
    app_device_id:{
        type: String,
        unique:true
    },
    expire_date:{
        type:String
    },
    is_trial:{
        type:Number,
        default:0, // 0=> Trial, 1=>Activated
    },
    ip:String,
    pin_code:{
        type:String,
        default:'0000'
    },
    lock:{
        type:Number,
        default:0
    },
    created_time:String,
    app_type:String,
    from_old_quzu:{  // 0=>not from old quzu, 1=>inserted from old quzu, 2=>updated from old quzu
        type:Number,
        default:0
    },
    version:String
});
module.exports = DeviceModel;
