const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let PlayList = new Schema({
    device_id:String,
    url:String,
    type:{
        type:String,
        default:'general'
    },
    name:String,
    user_name:String,
    password:String,
    app_type:String,
    from_old_quzu:{
        type:Number,
        default:0  // 0=> not from old quzu, 1=> from old quzu
    }
});
module.exports = PlayList;
