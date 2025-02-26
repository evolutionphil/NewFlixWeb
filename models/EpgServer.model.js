const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let EpgServer = new Schema({
    url:{
        type:String
    }
});
module.exports = mongoose.model('EpgServer', EpgServer);
