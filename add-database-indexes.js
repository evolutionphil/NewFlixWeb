
const mongoose = require('mongoose');
require('dotenv').config();

// Import device models
const AndroidDevice = require('./models/AndroidDevice.model');
const AppleDevice = require('./models/AppleDevice.model');
const SmartDevice = require('./models/SmartDevice.model');
const Device = require('./models/Device.model');

async function addIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_DSN, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('Connected to MongoDB, adding indexes...');

        // Add indexes for AndroidDevice
        console.log('Adding indexes for AndroidDevice...');
        await AndroidDevice.collection.createIndex({ mac_address: 1 });
        await AndroidDevice.collection.createIndex({ is_trial: 1 });
        await AndroidDevice.collection.createIndex({ created_time: 1 });
        await AndroidDevice.collection.createIndex({ mac_address: 1, is_trial: 1 }); // Compound index
        console.log('✓ AndroidDevice indexes added');

        // Add indexes for AppleDevice
        console.log('Adding indexes for AppleDevice...');
        await AppleDevice.collection.createIndex({ mac_address: 1 });
        await AppleDevice.collection.createIndex({ is_trial: 1 });
        await AppleDevice.collection.createIndex({ created_time: 1 });
        await AppleDevice.collection.createIndex({ mac_address: 1, is_trial: 1 }); // Compound index
        console.log('✓ AppleDevice indexes added');

        // Add indexes for SmartDevice
        console.log('Adding indexes for SmartDevice...');
        await SmartDevice.collection.createIndex({ mac_address: 1 });
        await SmartDevice.collection.createIndex({ is_trial: 1 });
        await SmartDevice.collection.createIndex({ created_time: 1 });
        await SmartDevice.collection.createIndex({ mac_address: 1, is_trial: 1 }); // Compound index
        console.log('✓ SmartDevice indexes added');

        // Add indexes for Device (legacy model)
        console.log('Adding indexes for Device...');
        await Device.collection.createIndex({ mac_address: 1 });
        await Device.collection.createIndex({ is_trial: 1 });
        await Device.collection.createIndex({ created_time: 1 });
        await Device.collection.createIndex({ last_used_at: 1 }); // For cleanup operations
        await Device.collection.createIndex({ mac_address: 1, is_trial: 1 }); // Compound index
        console.log('✓ Device indexes added');

        // Additional useful indexes
        console.log('Adding additional performance indexes...');
        
        // For old device cleanup queries
        await AndroidDevice.collection.createIndex({ created_time: 1, is_trial: 1 });
        await AppleDevice.collection.createIndex({ created_time: 1, is_trial: 1 });
        await SmartDevice.collection.createIndex({ created_time: 1, is_trial: 1 });
        await Device.collection.createIndex({ created_time: 1, is_trial: 1 });

        // For app_type filtering
        await AndroidDevice.collection.createIndex({ app_type: 1 });
        await AppleDevice.collection.createIndex({ app_type: 1 });
        await SmartDevice.collection.createIndex({ app_type: 1 });

        console.log('✓ All indexes added successfully!');

        // Show current indexes
        console.log('\n--- Current Indexes ---');
        const androidIndexes = await AndroidDevice.collection.getIndexes();
        console.log('AndroidDevice indexes:', Object.keys(androidIndexes));
        
        const appleIndexes = await AppleDevice.collection.getIndexes();
        console.log('AppleDevice indexes:', Object.keys(appleIndexes));
        
        const smartIndexes = await SmartDevice.collection.getIndexes();
        console.log('SmartDevice indexes:', Object.keys(smartIndexes));
        
        const deviceIndexes = await Device.collection.getIndexes();
        console.log('Device indexes:', Object.keys(deviceIndexes));

    } catch (error) {
        console.error('Error adding indexes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run the script
addIndexes();
