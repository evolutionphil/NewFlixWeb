const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let ActivationContent = new Schema({
    contents:String
});
module.exports = mongoose.model('ActivationContent', ActivationContent);
