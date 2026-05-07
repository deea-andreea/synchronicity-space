import mongoose from 'mongoose';

export const connectNoSql = async () => {
   const uri = "mongodb+srv://andreeazinca_db_user:z3a4%40Facultate@cluster-andreea.lfxcdgl.mongodb.net/?retryWrites=true&w=majority";

    try {
    console.log("Attempting NoSQL connection...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // Wait 10 seconds before giving up
    //   family: 4 // Force IPv4
    });
    console.log('✅ NoSQL Connection Established');
  } catch (error) {
    console.log('--- Debugging Info ---');
    console.log('Code:', error.code);
    console.log('Reason:', error.reason ? error.reason.servers : 'Unknown');
    console.error('Message:', error.message);
  }
}