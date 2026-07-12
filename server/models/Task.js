import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['coding', 'writing'], required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  deadline: { type: Date, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  evaluationRules: { type: String, default: '' },
  customPrompt: { type: String, default: '' },
  starterScaffold: { type: mongoose.Schema.Types.Mixed, default: {} }, // e.g. { files: { 'index.js': '// starter code' }, activeFile: 'index.js' }
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', taskSchema);
