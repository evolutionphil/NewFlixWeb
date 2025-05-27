const DeviceModel = require("../models/Device.model");
const PlayListModel = require("../models/PlayList.model");

exports.deleteDevices = async (req, res) => {
    try {
        const { mac_addresses } = req.body;
        
        for(mac_address of mac_addresses) {
            const device = await DeviceModel.findOne({ mac_address: mac_address });
            
            if(device) {
                await PlayListModel.deleteMany({ device_id: device._id });
                await device.deleteOne();
            }
        }


        res.json({ success: true, message: 'Devices deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to delete devices' });
    }
}