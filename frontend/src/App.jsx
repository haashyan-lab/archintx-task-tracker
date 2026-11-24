import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <h1>ArchintX Intern Task Tracker</h1>
      {user && (
        <div className="nav-right">
          <span>{user.name} ({user.role})</span>
          <button className="btn btn-logout" onClick={onLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}

function AuthPage({ setUser }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'intern' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignup) {
        await API.post('/auth/signup', form);
        setIsSignup(false);
        alert('Account created! Please login.');
      } else {
        const res = await API.post('/auth/login', { email: form.email, password: form.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-card">
      <h2>{isSignup ? 'Create Account' : 'ArchintX Login'}</h2>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
        )}
        <div className="form-group">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        </div>
        {isSignup && (
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="intern">Intern</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-primary">
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }} onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Login' : 'Sign Up'}
        </span>
      </p>
    </div>
  );
}

function InternDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading tasks...</div>;

  return (
    <div className="container">
      <h2>My Assigned Tasks</h2>
      {tasks.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>No tasks assigned yet.</p>
      ) : (
        <div className="task-grid">
          {tasks.map(task => (
            <div className="card" key={task._id}>
              <div>
                <div className="card-header">
                  <span className="track-tag">{task.track}</span>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                </div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <div className="card-footer">
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                <Link to={`/tasks/${task._id}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  View / Submit →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const fetchTask = () => {
    API.get(`/tasks/${id}`).then(res => {
      setData(res.data);
      if (res.data.submission) setLink(res.data.submission.submissionLink);
    });
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await API.post(`/tasks/${id}/submit`, { submissionLink: link });
      setMsg('Work submitted successfully!');
      fetchTask();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  if (!data) return <div className="container">Loading...</div>;

  const { task, submission } = data;

  return (
    <div className="container">
      <Link to="/dashboard" style={{ textDecoration: 'none', color: '#2563eb', fontWeight: 600 }}>← Back to Dashboard</Link>
      <div className="card" style={{ marginTop: '1rem', maxWidth: '650px' }}>
        <div className="card-header">
          <span className="track-tag">{task.track}</span>
          <span className={`badge badge-${task.status}`}>{task.status}</span>
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>{task.title}</h2>
        <p>{task.description}</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>

        {submission && (
          <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <strong>Last Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}<br />
            <strong>Link:</strong> <a href={submission.submissionLink} target="_blank" rel="noreferrer">{submission.submissionLink}</a>
          </div>
        )}

        {msg && <div className="success-msg">{msg}</div>}
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>GitHub / Google Drive / Live Link</label>
            <input
              type="url"
              required
              placeholder="https://github.com/username/repo"
              value={link}
              onChange={e => setLink(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {task.status === 'Submitted' ? 'Update Submission' : 'Submit Task'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/submissions')
      .then(res => setSubmissions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading submissions...</div>;

  return (
    <div className="container">
      <h2>HR Admin — Intern Submissions</h2>
      {submissions.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>No submissions recorded yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Intern</th>
              <th>Task</th>
              <th>Track</th>
              <th>Submission Link</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(sub => (
              <tr key={sub._id}>
                <td>{sub.userId?.name}<br /><small style={{ color: '#6b7280' }}>{sub.userId?.email}</small></td>
                <td>{sub.taskId?.title}</td>
                <td><span className="track-tag">{sub.taskId?.track}</span></td>
                <td><a href={sub.submissionLink} target="_blank" rel="noreferrer">Open Link</a></td>
                <td>{new Date(sub.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <AuthPage setUser={setUser} />} />
        <Route path="/dashboard" element={user?.role === 'intern' ? <InternDashboard /> : <Navigate to="/" />} />
        <Route path="/tasks/:id" element={user?.role === 'intern' ? <TaskDetail /> : <Navigate to="/" />} />
        <Route path="/admin" element={user?.role === 'admin' ? <AdminSubmissions /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}