const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let OldPlaylist = new Schema({
    macAddress:String,
    url:[String]
});
module.exports = mongoose.model('OldPlaylist', OldPlaylist);
