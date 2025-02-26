const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CoinList = new Schema({
    name:{
        type:String
    },
    code:String
});
module.exports = mongoose.model('CoinList', CoinList);
