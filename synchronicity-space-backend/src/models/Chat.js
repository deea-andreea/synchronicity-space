import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  senderId:   { type: String, required: true },
  senderName: { type: String, required: true },
  text:       { type: String, required: true },
  createdAt:  { type: Date, default: Date.now }
}, { _id: false });

const ChatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // user IDs sorted
  messages:     [MessageSchema]
}, { timestamps: true });

export default mongoose.model('Chat', ChatSchema);
