const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let LanguageWord = new Schema({
    language_id:String,
    word_id:String,
    value:String
});
module.exports = mongoose.model('LanguageWord', LanguageWord);
