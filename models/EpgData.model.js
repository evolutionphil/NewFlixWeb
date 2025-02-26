const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let EpgData = new Schema({
    start:String,
    stop:String,
    channel_id:String,
    title:String,
    desc:String,
});
module.exports = mongoose.model('EpgData', EpgData);
