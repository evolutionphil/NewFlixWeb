const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let OldDeviceInfo = new Schema({
    id:String,
    created_date:String,
    device_id:String,
    mac_address:String,
    platform:String,
    pin:String
});
module.exports = mongoose.model('OldDeviceInfo', OldDeviceInfo);
