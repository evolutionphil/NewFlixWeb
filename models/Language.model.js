const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Language = new Schema({
    code:String,
    name:String
});
module.exports = mongoose.model('Language', Language);
