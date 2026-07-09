import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // user IDs
}, { timestamps: true });

export default mongoose.model('Chat', ChatSchema);
