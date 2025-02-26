const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CountryCode = new Schema({
    code:{
        type:String
    },
    name:{
        type:String
    },
});
module.exports = mongoose.model('CountryCode', CountryCode);
