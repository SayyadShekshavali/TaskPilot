import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Submission from '../models/Submission.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_PASSWORDS = new Set(['admin123', '123admin', 'ad123min']);

// Isolate role resolution in one function
function resolveRoleFromPassword(password) {
  return ADMIN_PASSWORDS.has(password) ? 'admin' : 'candidate';
}

// Generate token helper
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'taskpilot-super-secret-key-123456789',
    { expiresIn: '7d' }
  );
}

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const role = resolveRoleFromPassword(password);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role
    });

    await user.save();
    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error during signup.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase();
    let user = await User.findOne({ email: cleanEmail });

    // Prototype helper: Auto-register user on first login to make demo testing seamless
    if (!user) {
      const role = resolveRoleFromPassword(password);
      const passwordHash = await bcrypt.hash(password, 10);
      const defaultName = cleanEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      const name = defaultName.charAt(0).toUpperCase() + defaultName.slice(1) || 'Demo User';

      user = new User({
        name,
        email: cleanEmail,
        passwordHash,
        role
      });
      await user.save();
    } else {
      // Validate password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      
      // Let's also check if user exists but has typed a whitelisted password (e.g. they want to login as admin)
      // If the password matches the admin whitelist, we can override or verify
      const isWhitelistedAdmin = ADMIN_PASSWORDS.has(password);
      
      if (!isMatch && !isWhitelistedAdmin) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // If they used a whitelisted admin password but they were stored as candidate, upgrade their role
      const expectedRole = resolveRoleFromPassword(password);
      if (user.role !== expectedRole) {
        user.role = expectedRole;
        await user.save();
      }
    }

    const token = generateToken(user);
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Current User route
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'taskpilot-super-secret-key-123456789');
    
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

// Update User Profile route
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, bio, skills, password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) user.skills = skills;
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    
    // Generate new token with updated details
    const token = generateToken(user);
    
    return res.status(200).json({
      message: 'Profile updated successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ message: 'Failed to update profile.' });
  }
});

// Wipe all database collections to test from scratch
router.post('/reset-database', async (req, res) => {
  try {
    const userWipe = await User.deleteMany({});
    const taskWipe = await Task.deleteMany({});
    const subWipe = await Submission.deleteMany({});
    
    console.log('Database collections wiped successfully.');
    return res.status(200).json({
      message: 'All tasks, candidate submissions, and user accounts have been successfully wiped from the database! Ready for a fresh test run.',
      stats: {
        usersDeleted: userWipe.deletedCount,
        tasksDeleted: taskWipe.deletedCount,
        submissionsDeleted: subWipe.deletedCount
      }
    });
  } catch (error) {
    console.error('Reset database route error:', error);
    return res.status(500).json({ message: 'Failed to clear database collections.' });
  }
});

export default router;
export { resolveRoleFromPassword };
