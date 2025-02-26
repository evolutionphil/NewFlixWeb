const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let ResellerActivity = new Schema({
    reseller_id:String,
    app_type:String,
    mac_address:String,
    used_credit:Number,
    activity_time:String,
    from_date:String,
    to_date:String,
    note:String,
    app_name:{
        type:String,
        default:'flix'  // value can be flix, quzu, aboxa
    },
    reseller_email:String
});
module.exports = mongoose.model('ResellerActivity', ResellerActivity);