import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'candidate'], default: 'candidate' },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
