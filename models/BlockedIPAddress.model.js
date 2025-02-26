const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let BlockedIPAdress = new Schema({
    ip:String,
    reason:String,
    count:String,
    time:String
});
module.exports = mongoose.model('BlockedIPAdress', BlockedIPAdress);
