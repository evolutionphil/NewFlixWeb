const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let EpgCode = new Schema({
    url:{
        type:String
    },
    country:String
});
module.exports = mongoose.model('EpgCode', EpgCode);
