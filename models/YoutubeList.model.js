const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let YoutubeList = new Schema({
    device_id:String,
    playlist_id:String,
    playlist_name:String,
    created_time:String
});
module.exports = mongoose.model('YoutubeList', YoutubeList);
