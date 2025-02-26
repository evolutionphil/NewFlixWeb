const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let FocusColor = new Schema({
    color:String,
    name:String
});
module.exports = mongoose.model('FocusColor', FocusColor);
