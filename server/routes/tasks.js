import express from 'express';
import jwt from 'jsonwebtoken';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { generateScaffold, runTier1Heuristics, runTier2SemanticReview } from '../utils/ai.js';
import { sendInviteEmail } from '../utils/email.js';
import { executeCode } from '../utils/judge0.js';

const router = express.Router();

// Helper to broadcast to Socket.io (will be bound in index.js)
export let ioInstance = null;
export const setIoInstance = (io) => {
  ioInstance = io;
};

// 1. Create Task (Admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      title, 
      type, 
      description, 
      difficulty, 
      deadline, 
      priority, 
      evaluationRules, 
      customPrompt, 
      candidates // Array of emails
    } = req.body;

    if (!title || !type || !description || !deadline) {
      return res.status(400).json({ message: 'Missing required task parameters.' });
    }

    // Generate workspace file scaffold
    const starterScaffold = await generateScaffold(title, type, description);

    // Save task
    const task = new Task({
      title,
      type,
      description,
      difficulty,
      deadline: new Date(deadline),
      priority,
      evaluationRules,
      customPrompt,
      starterScaffold
    });
    await task.save();

    const createdSubmissions = [];

    // Process candidate invites
    if (candidates && candidates.length > 0) {
      for (const email of candidates) {
        if (!email) continue;
        const cleanEmail = email.trim().toLowerCase();

        // Create JWT for single-use email invitation
        const accessToken = jwt.sign(
          { taskEmail: cleanEmail, taskId: task._id },
          process.env.JWT_SECRET || 'taskpilot-super-secret-key-123456789',
          { expiresIn: '30d' }
        );

        // Pre-initialize submission
        const submission = new Submission({
          candidateEmail: cleanEmail,
          task: task._id,
          status: 'not-started',
          accessToken,
          workspaceState: starterScaffold,
          analytics: {
            timeTaken: 0,
            linesWritten: 0,
            issueTrend: []
          }
        });

        await submission.save();
        createdSubmissions.push(submission);

        // Send Email
        let origin = process.env.CLIENT_URL || 'http://localhost:5173';
        if (req.headers.referer) {
          try {
            origin = new URL(req.headers.referer).origin;
          } catch (e) {
            // fallback
          }
        }
        const inviteUrl = `${origin}/invite/${accessToken}`;
        await sendInviteEmail(cleanEmail, title, inviteUrl);
      }
    }

    return res.status(201).json({ task, submissions: createdSubmissions });
  } catch (error) {
    console.error('Create Task Error:', error);
    return res.status(500).json({ message: 'Internal server error while creating task.' });
  }
});

// 2. Admin: Get all tasks (with submissions aggregated)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    
    // Attach submissions details
    const tasksWithSubmissions = await Promise.all(
      tasks.map(async (task) => {
        const subs = await Submission.find({ task: task._id }).lean();
        return {
          ...task,
          submissions: subs
        };
      })
    );

    return res.status(200).json(tasksWithSubmissions);
  } catch (error) {
    console.error('List Tasks Error:', error);
    return res.status(500).json({ message: 'Failed to retrieve tasks.' });
  }
});

// 3. Candidate: Get tasks assigned to them (auth-protected)
router.get('/candidate', verifyToken, async (req, res) => {
  try {
    const candidateEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    
    // Find submissions matching candidate email
    const submissions = await Submission.find({ candidateEmail })
      .populate('task')
      .sort({ startedAt: -1 })
      .lean();

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Candidate tasks retrieve error:', error);
    return res.status(500).json({ message: 'Failed to fetch candidate tasks.' });
  }
});

// 3b. Candidate: Get activity heatmap (last 365 days)
router.get('/candidate/activity', verifyToken, async (req, res) => {
  try {
    const candidateEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    
    const activityMap = {};
    const today = new Date();
    // 365 days of dates
    for (let i = 365; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      activityMap[dateStr] = 0;
    }

    const submissions = await Submission.find({ 
      candidateEmail, 
      status: { $in: ['completed', 'under-review'] },
      submittedAt: { $ne: null }
    }).lean();

    submissions.forEach(sub => {
      if (sub.submittedAt) {
        const dateStr = new Date(sub.submittedAt).toISOString().split('T')[0];
        if (activityMap[dateStr] !== undefined) {
          activityMap[dateStr]++;
        }
      }
    });

    const responseData = Object.keys(activityMap).map(date => ({
      date,
      completedTasks: activityMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Candidate activity retrieve error:', error);
    return res.status(500).json({ message: 'Failed to fetch candidate activity.' });
  }
});

// 4. Token Welcome: Resolve task invitation without login credentials
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskpilot-super-secret-key-123456789');

    const submission = await Submission.findOne({ accessToken: token }).populate('task');
    if (!submission) {
      return res.status(404).json({ message: 'Invitation link has expired or is invalid.' });
    }

    return res.status(200).json({
      submissionId: submission._id,
      candidateEmail: submission.candidateEmail,
      status: submission.status,
      task: submission.task
    });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired invitation token.' });
  }
});

// 5. Start task (token-based or regular login)
router.post('/invite/:token/start', async (req, res) => {
  try {
    const { token } = req.params;
    const { candidateName } = req.body;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskpilot-super-secret-key-123456789');
    const submission = await Submission.findOne({ accessToken: token }).populate('task');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    if (submission.status === 'not-started') {
      submission.status = 'in-progress';
      submission.startedAt = new Date();
      if (candidateName) {
        submission.candidateName = candidateName;
      }
      await submission.save();
    }

    // Auto signup candidate in User DB if not exists
    const emailLower = submission.candidateEmail.toLowerCase();
    let dbUser = await User.findOne({ email: emailLower });
    if (!dbUser) {
      dbUser = new User({
        name: submission.candidateName || candidateName || emailLower.split('@')[0],
        email: emailLower,
        passwordHash: 'MagicInviteCodeAccess', 
        role: 'candidate'
      });
      await dbUser.save();
    }

    return res.status(200).json(submission);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to start task.' });
  }
});

// 6. Get single submission details
router.get('/submissions/:id', verifyToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('task');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Security check: candidate can only see their own submission, admin can see all
    const userEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    if (req.user.role === 'candidate' && submission.candidateEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({ message: 'Unauthorized access to submission details.' });
    }

    return res.status(200).json(submission);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch submission.' });
  }
});

// 7. Autosave and trigger two-tier AI review check
router.put('/submissions/:id/autosave', verifyToken, async (req, res) => {
  try {
    const { workspaceState, timeElapsed } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const userEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    if (req.user.role === 'candidate' && submission.candidateEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Save editor state
    submission.workspaceState = workspaceState;
    if (timeElapsed) {
      submission.analytics.timeTaken = timeElapsed;
    }

    // Calculate lines written
    if (workspaceState.files) {
      let lines = 0;
      Object.values(workspaceState.files).forEach(code => {
        lines += (code.split('\n') || []).length;
      });
      submission.analytics.linesWritten = lines;
    } else if (workspaceState.content) {
      const text = workspaceState.content.replace(/<[^>]*>/g, ' ');
      submission.analytics.linesWritten = Math.ceil(text.length / 80); // proxy lines
    }

    // Load full Task details
    const task = await Task.findById(submission.task);

    // --- TIER 1: Instant Heuristics Pass ---
    const tier1Issues = runTier1Heuristics(task, workspaceState);

    // Update status based on issue count
    const totalTier1Errors = tier1Issues.filter(i => i.severity === 'error').length;
    if (totalTier1Errors > 0 && submission.status === 'in-progress') {
      submission.status = 'issues-flagged';
    } else if (totalTier1Errors === 0 && submission.status === 'issues-flagged') {
      submission.status = 'in-progress';
    }

    // Setup an initial feedback entry in DB
    const feedbackEntry = {
      timestamp: new Date(),
      issueCount: tier1Issues.length,
      issues: tier1Issues,
      score: submission.aiFeedbackHistory[0]?.score || 0,
      summary: 'Heuristic checks executed. Deeper evaluation running...'
    };

    // Save immediate Tier 1 status
    await submission.save();

    // Broadcast Tier 1 updates to admin live dashboards
    if (ioInstance) {
      ioInstance.to(submission._id.toString()).emit('workspaceStateUpdate', {
        workspaceState,
        status: submission.status,
        issues: tier1Issues,
        timeTaken: submission.analytics.timeTaken
      });
      ioInstance.emit('monitorUpdate', {
        submissionId: submission._id,
        candidateEmail: submission.candidateEmail,
        status: submission.status,
        issueCount: tier1Issues.length,
        timeTaken: submission.analytics.timeTaken
      });
    }

    // Send immediate HTTP Response (target < 1s)
    res.status(200).json({
      message: 'Workspace autosaved successfully.',
      status: submission.status,
      tier1Feedback: feedbackEntry
    });

    // --- TIER 2: Deep Async Semantic Review ---
    // Runs in the background, non-blocking
    setTimeout(async () => {
      try {
        const tier2Feedback = await runTier2SemanticReview(task, workspaceState);
        
        // Find latest submission record
        const currentSub = await Submission.findById(submission._id);
        if (!currentSub) return;

        // Combine Tier 1 and Tier 2 issues, removing duplicates if any
        const combinedIssues = [...tier1Issues];
        
        // If Gemini flagged new issues, add them
        if (tier2Feedback.issues && Array.isArray(tier2Feedback.issues)) {
          tier2Feedback.issues.forEach(i => {
            const isDuplicate = combinedIssues.some(
              ci => ci.message === i.message && ci.file === i.file
            );
            if (!isDuplicate) {
              combinedIssues.push(i);
            }
          });
        }

        const errorsCount = combinedIssues.filter(i => i.severity === 'error').length;
        currentSub.status = errorsCount > 0 ? 'issues-flagged' : 'in-progress';

        const newFeedbackRecord = {
          timestamp: new Date(),
          issueCount: combinedIssues.length,
          issues: combinedIssues,
          score: tier2Feedback.score,
          summary: tier2Feedback.summary
        };

        // Keep track of trends over time
        currentSub.aiFeedbackHistory.push(newFeedbackRecord);
        currentSub.analytics.issueTrend.push({
          timestamp: new Date(),
          count: combinedIssues.length
        });

        await currentSub.save();

        // Broadcast Tier 2 final semantic updates
        if (ioInstance) {
          ioInstance.to(currentSub._id.toString()).emit('aiFeedbackUpdate', newFeedbackRecord);
          ioInstance.emit('monitorUpdate', {
            submissionId: currentSub._id,
            candidateEmail: currentSub.candidateEmail,
            status: currentSub.status,
            issueCount: combinedIssues.length,
            timeTaken: currentSub.analytics.timeTaken
          });
        }
      } catch (err) {
        console.error('Async Tier 2 loop failed:', err);
      }
    }, 100);

  } catch (error) {
    console.error('Autosave Error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Autosave processing failed.' });
    }
  }
});


// Run Code execution (without final submission)
router.post('/submissions/:id/run', verifyToken, async (req, res) => {
  try {
    const { workspaceState } = req.body;
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const userEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    if (req.user.role === 'candidate' && submission.candidateEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const task = await Task.findById(submission.task);
    let testResults = {};
    if (task.type === 'coding') {
      const files = workspaceState?.files || {};
      const activeFile = workspaceState?.activeFile || Object.keys(files)[0] || '';
      const mainCode = files[activeFile] || Object.values(files)[0] || '';
      testResults = await executeCode(mainCode, activeFile);
    } else {
      const text = (workspaceState?.content || '').replace(/<[^>]*>/g, ' ').trim();
      testResults = {
        status: 'Completed',
        stdout: `Word count: ${text ? text.split(/\s+/).length : 0} words. Heuristics checked.`,
        success: true
      };
    }

    submission.testResults = testResults;
    await submission.save();

    return res.status(200).json({ testResults });
  } catch (error) {
    console.error('Run Code Error:', error);
    return res.status(500).json({ message: 'Code compilation failed.' });
  }
});

// 8. Submit Task (Candidate finishes workspace work)
router.post('/submissions/:id/submit', verifyToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    const userEmail = (req.user.email || req.user.taskEmail || '').toLowerCase();
    if (req.user.role === 'candidate' && submission.candidateEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    // Run compile if coding
    const task = await Task.findById(submission.task);
    if (task.type === 'coding') {
      const files = submission.workspaceState?.files || {};
      const activeFile = submission.workspaceState?.activeFile || Object.keys(files)[0] || '';
      const mainCode = files[activeFile] || Object.values(files)[0] || '';
      const execResult = await executeCode(mainCode, activeFile);
      submission.testResults = execResult;
    }

    submission.status = 'under-review';
    submission.submittedAt = new Date();
    await submission.save();

    // Notify admins via socket
    if (ioInstance) {
      ioInstance.emit('monitorUpdate', {
        submissionId: submission._id,
        candidateEmail: submission.candidateEmail,
        status: 'under-review',
        submitted: true
      });
      ioInstance.to(submission._id.toString()).emit('submitted', { submission });
    }

    return res.status(200).json({ message: 'Task submitted successfully.', submission });
  } catch (error) {
    console.error('Submit Task Error:', error);
    return res.status(500).json({ message: 'Failed to complete submission.' });
  }
});

// 9. Admin decision: Approve / Request revisions
router.post('/submissions/:id/review', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { decision } = req.body; // 'approved' or 'needs-revision'
    if (!decision || !['approved', 'needs-revision'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid review decision.' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    submission.adminDecision = decision;
    submission.status = decision === 'approved' ? 'completed' : 'issues-flagged';
    submission.reviewedAt = new Date();
    await submission.save();

    // Broadcast review result
    if (ioInstance) {
      ioInstance.emit('monitorUpdate', {
        submissionId: submission._id,
        candidateEmail: submission.candidateEmail,
        status: submission.status
      });
      ioInstance.to(submission._id.toString()).emit('reviewed', { submission });
    }

    return res.status(200).json({ message: 'Task reviewed successfully.', submission });
  } catch (error) {
    console.error('Admin Review Error:', error);
    return res.status(500).json({ message: 'Failed to save review decision.' });
  }
});

export default router;
