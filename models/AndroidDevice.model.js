const mongoose = require('mongoose');
let DeviceModel=require('./DeviceSchema');
module.exports = mongoose.model('AndroidDevice', DeviceModel);
