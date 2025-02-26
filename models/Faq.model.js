const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Faq = new Schema({
    title:{
        type:String
    },
    content:{
        type:String
    },
});
module.exports = mongoose.model('Faq', Faq);
