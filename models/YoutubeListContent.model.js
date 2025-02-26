const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let YoutubeListContent = new Schema({
    contents:String
});
module.exports = mongoose.model('YoutubeListContent', YoutubeListContent);
