const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CreditPackage = new Schema({
    credit_count:{
        type:Number,
        unique:true
    },
    duration:Number,
    name:String
});
module.exports = mongoose.model('CreditPackage', CreditPackage);
