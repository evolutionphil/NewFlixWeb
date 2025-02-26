const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CreditHistory = new Schema({
    from:String, // if 0, or null => credit gave from admin, if not null or 0, credit gave from reseller to his sub reseller
    to:String,
    activity_time:String,
    note:String,
    credits:Number
});
module.exports = mongoose.model('CreditHistory', CreditHistory);