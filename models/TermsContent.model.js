const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let TermsContent = new Schema({
    contents:String
});
module.exports = mongoose.model('TermsContent', TermsContent);
