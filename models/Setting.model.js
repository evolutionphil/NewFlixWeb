const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Setting = new Schema({
    key:{
        type:String
    },
    value:{
        type:String
    },
});
module.exports = mongoose.model('Setting', Setting);
