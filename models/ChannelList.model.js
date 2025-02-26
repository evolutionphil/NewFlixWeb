const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let ChannelList = new Schema({
    channel_id:String,
    name:String,
    epg_code_id:String,
});
module.exports = mongoose.model('ChannelList', ChannelList);
