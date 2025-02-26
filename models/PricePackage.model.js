const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let PricePackage = new Schema({
    name:String,
    duration:Number,  // as months
    price:String
});
module.exports = mongoose.model('PricePackage', PricePackage);
