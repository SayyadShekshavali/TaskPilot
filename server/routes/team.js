import express from 'express';
import User from '../models/User.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get team members (Admins)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-passwordHash').sort({ createdAt: -1 });
    // If empty, return a default mock roster so the screen is pre-populated
    if (admins.length === 0) {
      return res.status(200).json([
        { _id: '1', name: 'Sarah Connor', email: 'sarah@taskpilot.io', role: 'admin', createdAt: new Date() },
        { _id: '2', name: 'John Doe', email: 'john@taskpilot.io', role: 'admin', createdAt: new Date() }
      ]);
    }
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch team roster.' });
  }
});

// Invite team member
router.post('/invite', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, targetRole } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email is already a member.' });
    }

    // In a real app we send an email. For demo, we just create them with a default password and role: admin
    const passwordHash = '$2a$10$T878B3FjXh9aD8m9F8k2e.vLd5iM0.U3l.bFzI0l.H6Q6rG7c3W.G'; // bcrypt for admin123
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      role: 'admin',
      passwordHash
    });
    await newUser.save();

    return res.status(201).json({ message: 'Team member added successfully', member: newUser });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add team member.' });
  }
});

export default router;
