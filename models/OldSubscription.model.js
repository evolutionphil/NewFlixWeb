const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let OldSubscription = new Schema({
    email:String,
    expire_date:String,
    payment_method:String,
    device_info_id:Number
});
module.exports = mongoose.model('OldSubscription', OldSubscription);
