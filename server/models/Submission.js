import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  message: { type: String, required: true },
  line: { type: Number, default: 1 },
  file: { type: String, default: '' },
  severity: { type: String, enum: ['error', 'warning', 'info'], default: 'warning' },
  type: { type: String, enum: ['alignment', 'style', 'syntax'], default: 'alignment' },
  suggestion: { type: String, default: '' },
  target: { type: String, default: '' }
});

const feedbackHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  issueCount: { type: Number, default: 0 },
  issues: [issueSchema],
  score: { type: Number, default: 0 },
  summary: { type: String, default: '' }
});

const submissionSchema = new mongoose.Schema({
  candidateName: { type: String },
  candidateEmail: { type: String, required: true },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  status: { 
    type: String, 
    enum: ['not-started', 'in-progress', 'issues-flagged', 'under-review', 'completed'], 
    default: 'not-started' 
  },
  accessToken: { type: String, unique: true }, // unique token for invite link
  workspaceState: { type: mongoose.Schema.Types.Mixed, default: {} }, // coding: { files, activeFile }, writing: { content }
  aiFeedbackHistory: [feedbackHistorySchema],
  testResults: { type: mongoose.Schema.Types.Mixed, default: {} }, // compilation output
  analytics: {
    timeTaken: { type: Number, default: 0 }, // in seconds
    linesWritten: { type: Number, default: 0 },
    issueTrend: [
      {
        timestamp: { type: Date, default: Date.now },
        count: { type: Number, default: 0 }
      }
    ]
  },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  adminDecision: { type: String, enum: ['approved', 'needs-revision'] }
});

export default mongoose.model('Submission', submissionSchema);
