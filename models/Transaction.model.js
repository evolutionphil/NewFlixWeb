const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Transaction = new Schema({
    device_id:{
        type:String
    },
    payment_id:{
        type:String
    },
    payment_type:String,
    amount:{
        type:Number
    },
    status:{
        type:String,
        default:'pending'
    },
    email:String,
    pay_time:{
        type:String
    },
    status_url:{
        type:String,
        default:''
    },
    created_time:String,
    ip:String,
    user_agent:String,
    mac_address:String,
    app_type:String
});
Transaction.index({pay_time:1})
Transaction.index({pay_time:-1})
module.exports = mongoose.model('Transaction', Transaction);