const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Instruction = new Schema({
    content:{
        type:String
    },
    kind:String
});
module.exports = mongoose.model('Instruction', Instruction);
