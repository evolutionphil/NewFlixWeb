const BlockListModel = require("../models/BlockList.model");
const cloudflareService = require("../services/cloudflare-service");

exports.blockIps = async (req, res) => {
    const { ips } = req.body;

    for (const ip of ips) {
        const blockedIp = await BlockListModel.findOne({ value: ip, type: 'ip_address' });
        if (blockedIp) {
            continue;
        }

        const cloudflareId = await cloudflareService.blockIp(ip);

        if (!cloudflareId) {
            continue;
        }

        const newBlockedIp = new BlockListModel({
            type: 'ip_address',
            value: ip,
            created_at: new Date(),
            cloudflare_id: cloudflareId
        });

        await newBlockedIp.save();
    }

    res.json({ success: true, message: 'IPs blocked successfully' });
}

exports.unblockIps = async (req, res) => {
    const { ips } = req.body;

    for (const ip of ips) {
        const blockedIp = await BlockListModel.findOne({ value: ip, type: 'ip_address' });

        if (!blockedIp) {
            continue;
        }

        const unblocked = await cloudflareService.unblockIp(blockedIp.cloudflare_id);
        if (!unblocked) {
            continue;
        }

        await BlockListModel.deleteOne({ _id: blockedIp._id });
    }

    res.json({ success: true, message: 'IPs unblocked successfully' });
}