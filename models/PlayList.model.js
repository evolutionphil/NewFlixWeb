const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let PlayList = new Schema({
    device_id:String,
    url:String,
    created_time:String
});
module.exports = mongoose.model('PlayList', PlayList);
