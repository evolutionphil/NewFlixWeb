const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let MyListContent = new Schema({
    contents:String
});
module.exports = mongoose.model('MyListContent', MyListContent);
