const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResellerPackageModel=new Schema({
    name:String,
    price:Number,
    max_connections:Number
});

module.exports = mongoose.model('ResellerPackage', ResellerPackageModel);
