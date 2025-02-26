const mongoose = require('mongoose');
let DeviceModel=require('./DeviceSchema');
module.exports = mongoose.model('SmartDevice', DeviceModel);
