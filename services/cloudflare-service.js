const axios = require('axios');

const axiosInstance = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

exports.blockIp = async (ip) => {
    try {

        const response = await axiosInstance.post(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules`, {
            mode: 'block',
            configuration: {
                target: 'ip',
                value: ip
            },
            notes: `Blocked by IP Block Service - ${new Date().toISOString()}`
        });

        return response.data.result.id || false;
    } catch (error) {
        console.error(error);
        return false;
    }
}

exports.unblockIp = async (cloudflareId) => {
    try {
        const response = await axiosInstance.delete(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/firewall/access_rules/rules/${cloudflareId}`);

        return response.data.success || false;
    } catch (error) {
        console.error(error);
        return false;
    }
}
