const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Word = new Schema({
    name:String
});
module.exports = mongoose.model('Word', Word);
