require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Task, Submission } = require('./models');

async function seedDatabase() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for seeding...');

  await User.deleteMany({});
  await Task.deleteMany({});
  await Submission.deleteMany({});

  const internPassword = await bcrypt.hash('intern123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const intern = await User.create({
    name: 'Haashyan Intern',
    email: 'intern@archintx.com',
    password: internPassword,
    role: 'intern'
  });

  await User.create({
    name: 'HR Admin',
    email: 'admin@archintx.com',
    password: adminPassword,
    role: 'admin'
  });

  await Task.insertMany([
    {
      title: 'Build Responsive Landing Page',
      description: 'Create a responsive hero section, features grid, and footer using React and CSS.',
      track: 'Frontend',
      dueDate: new Date('2026-11-28'),
      assignedTo: intern._id,
      status: 'Pending'
    },
    {
      title: 'REST API Authentication Module',
      description: 'Implement JWT-based signup and login endpoints with bcrypt password hashing.',
      track: 'Backend',
      dueDate: new Date('2026-11-30'),
      assignedTo: intern._id,
      status: 'Pending'
    },
    {
      title: 'Database Schema & ER Diagram',
      description: 'Design normalized schemas for Users, Tasks, and Submissions with proper references.',
      track: 'Database',
      dueDate: new Date('2026-12-02'),
      assignedTo: intern._id,
      status: 'Pending'
    },
    {
      title: 'Dashboard State Management',
      description: 'Connect frontend dashboard to live backend API and render dynamic status badges.',
      track: 'Frontend',
      dueDate: new Date('2026-12-04'),
      assignedTo: intern._id,
      status: 'Pending'
    },
    {
      title: 'Cloud Deployment & CI Setup',
      description: 'Deploy backend on Render and frontend on Vercel with production environment variables.',
      track: 'DevOps',
      dueDate: new Date('2026-12-06'),
      assignedTo: intern._id,
      status: 'Pending'
    }
  ]);

  console.log('Seed Data Inserted! Logins: intern@archintx.com / intern123 & admin@archintx.com / admin123');
  process.exit();
}

seedDatabase();