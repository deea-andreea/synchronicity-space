import mongoose from 'mongoose';

export const connectNoSql = async () => {
   const uri = process.env.MONGO_URI;

    try {
    console.log("Attempting NoSQL connection...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, 
    });
    console.log('✅ NoSQL Connection Established');
  } catch (error) {
    console.log('--- Debugging Info ---');
    console.log('Code:', error.code);
    console.log('Reason:', error.reason ? error.reason.servers : 'Unknown');
    console.error('Message:', error.message);
  }
}