require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Task, Submission } = require('./models');
const { protect, adminOnly } = require('./middleware');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.get('/', (req, res) => res.send('ArchintX Task Tracker API Running'));

// 1. POST /auth/signup
app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: role || 'intern' });
    res.status(201).json({ message: 'User created', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. GET /tasks (Logged-in user's tasks)
app.get('/tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. GET /tasks/:id (Single task detail)
app.get('/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const submission = await Submission.findOne({ taskId: task._id, userId: req.user.id });
    res.json({ task, submission });
  } catch (err) {
    res.status(400).json({ message: 'Invalid task ID' });
  }
});

// 5. POST /tasks/:id/submit (Submit link & mark Submitted)
app.post('/tasks/:id/submit', protect, async (req, res) => {
  try {
    const { submissionLink } = req.body;
    if (!submissionLink) return res.status(400).json({ message: 'Submission link is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const submission = await Submission.findOneAndUpdate(
      { taskId: task._id, userId: req.user.id },
      { submissionLink, submittedAt: new Date() },
      { upsert: true, new: true }
    );

    task.status = 'Submitted';
    await task.save();

    res.json({ message: 'Task submitted successfully', task, submission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. GET /admin/submissions (Admin only - HR view)
app.get('/admin/submissions', protect, adminOnly, async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('userId', 'name email')
      .populate('taskId', 'title track status dueDate')
      .sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));