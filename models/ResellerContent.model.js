const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let ResellerContent = new Schema({
    contents:String
});
module.exports = mongoose.model('ResellerContent', ResellerContent);
