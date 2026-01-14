const mongoose = require('mongoose');
const PSBActivation = require('../models/PSBActivation');
const PSBOrder = require('../models/PSBOrder');
require('dotenv').config();

async function migrateCustomerNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all activations without customerName
    const activations = await PSBActivation.find({ 
      $or: [
        { customerName: { $exists: false } },
        { customerName: null },
        { customerName: '' }
      ]
    });
    console.log(`Found ${activations.length} activations to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const activation of activations) {
      try {
        // Get PSBOrder
        const order = await PSBOrder.findById(activation.psbOrderId);
        
        if (order && order.customerName) {
          // Update activation with customerName
          await PSBActivation.findByIdAndUpdate(activation._id, {
            customerName: order.customerName
          });
          migrated++;
          console.log(`✅ Migrated activation ${activation._id}: ${order.customerName}`);
        } else {
          failed++;
          console.log(`❌ No order found for activation ${activation._id}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error migrating activation ${activation._id}:`, error.message);
      }
    }

    console.log(`\n✅ Migration complete: ${migrated} migrated, ${failed} failed`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCustomerNames();
