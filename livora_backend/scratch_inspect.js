require('dotenv').config();
const mongoose = require('mongoose');

async function checkValidators() {
  await mongoose.connect(process.env.MONGODB_URI);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    if (c.options && c.options.validator) {
      console.log('=== COLLECTION:', c.name, '===');
      console.log(JSON.stringify(c.options.validator, null, 2));
    }
  }
  await mongoose.disconnect();
}

checkValidators().catch(err => {
  console.error(err);
  process.exit(1);
});
