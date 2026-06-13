import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import GeneralDashboard from './pages/GeneralDashboard';
import JobEntry from './pages/JobEntry';
import JobSeekerEntry from './pages/JobSeekerEntry';
import HotJobSearch from './pages/HotJobSearch';
import JobSeekerSearch from './pages/JobSeekerSearch';
import EmploymentCenterDashboard from './pages/EmploymentCenterDashboard';
import InformationAndHelp from './pages/InformationAndHelp';
import HotJobsReview from './pages/HotJobsReview';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import JobSeekerMatchesReport from './pages/JobSeekerMatchesReport';
import ResumeCoach from './pages/ResumeCoach';

// Manual Version Configuration - Update this string to change the application version displayed in the header
<<<<<<< HEAD
<<<<<<< Updated upstream
const APP_VERSION = "Beta v0.11";
=======
const APP_VERSION = "Beta v0.13";
>>>>>>> Stashed changes
=======
const APP_VERSION = "Beta v0.12";
>>>>>>> contributor/master

function TopBar({ user, handleLogout }) {
  const location = useLocation();
  const isJobSeekerDashboard = location.pathname === '/' || location.pathname === '/job-seeker-dashboard';

  if (!user || isJobSeekerDashboard) {
    return null;
  }

  return (
    <div className="top-bar">
      <Link to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'} className="brand" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
        <div>GoodJobNet - <span style={{ color: 'red' }}>{APP_VERSION}</span></div>
        <div style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-light)', marginTop: '2px' }}>Click here to return to dashboard</div>
      </Link>
      <div className="user-controls">
        <Link to="/help" className="help-link-btn" style={{ marginRight: '15px' }}>Information and help</Link>
        <span>Welcome, {user.name}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <TopBar user={user} handleLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<JobSeekerDashboard />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard />} />
        <Route path="/hot-job-search" element={<HotJobSearch user={user} />} />
        <Route path="/resume-coach" element={<ResumeCoach />} />
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
            <Route path="/job-seeker-matches-report" element={<JobSeekerMatchesReport />} />
            <Route path="/job-seeker-search" element={<JobSeekerSearch />} />
          </>
        ) : (
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
