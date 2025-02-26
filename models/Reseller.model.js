const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Reseller = new Schema({
    id:Number,
    email:{
        type:String,
        unique:true
    },
    password:{
        type:String
    },
    max_connections:{
        type:Number,
        default:0
    },
    used_count:{
        type:Number,
        default:0
    },
    created_time:{
        type:String
    },
    created_by: {
        type:String,
        default:null // if 0=>master reseller and created by admin
    },
    deleted:{
        type:Number,
        default:0
    },
    deleted_time:{
        type:String,
        default:null
    },
    blocked:{
        type:Number,
        default:0
    },
    note:String,
    hidden:Number
});
module.exports = mongoose.model('Reseller', Reseller);
