
const mongoose = require('mongoose');
const BlockList = require('./models/BlockList.model');

// Connect to MongoDB using the same connection string from your app
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_DSN || 'your_mongodb_connection_string_here', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const checkBlockedIPs = async () => {
    try {
        // Find all blocked IP addresses
        const blockedIPs = await BlockList.find({ type: 'ip_address' });
        
        console.log(`\n=== BLOCKED IP ADDRESSES ===`);
        console.log(`Total blocked IPs: ${blockedIPs.length}\n`);
        
        if (blockedIPs.length === 0) {
            console.log('No IP addresses are currently blocked.');
        } else {
            blockedIPs.forEach((item, index) => {
                console.log(`${index + 1}. IP: ${item.value}`);
                console.log(`   Cloudflare ID: ${item.cloudflare_id || 'N/A'}`);
                console.log(`   Created: ${item.created_at}`);
                console.log('---');
            });
        }
        
        // Also check for any blocked MAC addresses if they exist
        const blockedMACs = await BlockList.find({ type: 'mac_address' });
        
        if (blockedMACs.length > 0) {
            console.log(`\n=== BLOCKED MAC ADDRESSES ===`);
            console.log(`Total blocked MACs: ${blockedMACs.length}\n`);
            
            blockedMACs.forEach((item, index) => {
                console.log(`${index + 1}. MAC: ${item.value}`);
                console.log(`   Cloudflare ID: ${item.cloudflare_id || 'N/A'}`);
                console.log(`   Created: ${item.created_at}`);
                console.log('---');
            });
        }
        
    } catch (error) {
        console.error('Error checking blocked IPs:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
};

// Run the check
const runCheck = async () => {
    await connectDB();
    await checkBlockedIPs();
};

runCheck();
