import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import GeneralDashboard from './pages/GeneralDashboard';
import JobEntry from './pages/JobEntry';
import JobSeekerEntry from './pages/JobSeekerEntry';
import HotJobSearch from './pages/HotJobSearch';
import EmploymentCenterDashboard from './pages/EmploymentCenterDashboard';
import InformationAndHelp from './pages/InformationAndHelp';
import HotJobsReview from './pages/HotJobsReview';
import JobSeekerDashboard from './pages/JobSeekerDashboard';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      {user && (
        <div className="top-bar">
          <Link to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'} className="brand" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
            <div>GoodJobNet - <span style={{ color: 'red' }}>Beta</span></div>
            <div style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-light)', marginTop: '2px' }}>Click here to return to dashboard</div>
          </Link>
          <div className="user-controls">
            <Link to="/help" className="help-link-btn" style={{ marginRight: '15px' }}>Information and help</Link>
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard />} />
        <Route path="/hot-job-search" element={<HotJobSearch />} />
        {user ? (
          <>
            <Route path="/dashboard" element={<GeneralDashboard />} />
            <Route path="/admin-dashboard" element={<EmploymentCenterDashboard />} />
            <Route path="/help" element={<InformationAndHelp />} />
            <Route path="/job-entry" element={<JobEntry user={user} />} />
            <Route path="/job-seeker-entry" element={<JobSeekerEntry user={user} />} />
            <Route path="/hot-jobs-review" element={<HotJobsReview user={user} />} />
            <Route path="/hot-jobs-5review" element={<HotJobsReview user={user} />} />
            <Route path="/hot-jobs-46review" element={<HotJobsReview user={user} />} />
          </>
        ) : (
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
