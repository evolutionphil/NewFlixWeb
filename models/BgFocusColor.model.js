const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let BackgroundColor = new Schema({
    color:String,
    name:String
});
module.exports = mongoose.model('BgFocusColor', BackgroundColor);
