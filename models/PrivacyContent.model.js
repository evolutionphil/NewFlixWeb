const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let PrivacyContent = new Schema({
    contents:String
});
module.exports = mongoose.model('PrivacyContent', PrivacyContent);
