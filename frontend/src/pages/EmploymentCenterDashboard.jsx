import { Link, useNavigate } from 'react-router-dom';
import { FaBriefcase, FaUserTie, FaSearch, FaMapMarkedAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { trackClick } from '../utils/tracking';

function EmploymentCenterDashboard({ user }) {
  const navigate = useNavigate();

  // Usage tracking: username is blank for sessions saved before login returned it.
  const trackStaff = (target) => trackClick(target, 'employment_center_dashboard', user?.username || null);

  const [stats, setStats] = useState({
    unverified_jobseekers_count: '...',
    new_jobs_count: '...',
    new_jobs_url: '#',
    total_hot_jobs: '...',
    total_job_seekers: '...',
    job_types: {},
    seeker_types: {},
    unverified_no_career_count: '...'
  });



  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats({
            unverified_jobseekers_count: data.unverified_jobseekers_count !== undefined ? data.unverified_jobseekers_count : (data.expiring_soon ?? '0'),
            new_jobs_count: data.new_jobs_count,
            new_jobs_url: data.new_jobs_url,
            total_hot_jobs: data.total_hot_jobs,
            total_job_seekers: data.total_job_seekers,
            job_types: data.job_types || {},
            seeker_types: data.seeker_types || {},
            unverified_no_career_count: data.unverified_no_career_count
          });
        }
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
  }, []);



  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1000px' }}>
        <header>
          <h1>Employment Center Dashboard</h1>
          <p className="subtitle">Metrics and Management for Orlando Employment Center</p>
        </header>

        {/* Top Section: Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {/* Placeholder: future metric (previously "Hot Jobs by Industry" pie chart) */}
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {/* Placeholder: future metric (previously "Job Seekers by Desired Type" pie chart) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <Link to="/assigned-job-seekers" className="btn primary-btn" style={{ width: 'auto', background: '#8e44ad' }}>Show my assigned Job Seekers list</Link>
              <Link to="/hot-jobs-review?category=my_assigned_seekers" className="btn secondary-btn" style={{ width: 'auto', borderColor: '#8e44ad', color: '#8e44ad' }} onClick={() => trackStaff('verify_assigned_seekers_jobs')}>Verify Jobs for My Assigned Seekers</Link>
            </div>
          </div>
        </div>

        {/* Middle Section: Alerts */}
        <div className="alerts-section mb-2" style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#c0392b', marginBottom: '1rem' }}>Attention Needed</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Link to="/hot-jobs-review?category=jobseekers" className="dashboard-alert-link">
                <span>Unverified jobs with interested jobseekers:</span>
                <strong>{stats.unverified_jobseekers_count}</strong>
              </Link>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Link to="/hot-jobs-review?category=unverified_no_career" className="dashboard-alert-link">
                <span>Phone Verification Queue (unverified &gt; 3 months):</span>
                <strong>{stats.unverified_no_career_count}</strong>
              </Link>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>New unreviewed Job Opportunities:</span>
              <strong>{stats.new_jobs_count}</strong>
            </li>
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/hot-jobs-review" className="btn primary-btn" style={{ background: '#e74c3c', flex: 1 }} onClick={() => trackStaff('review_hot_jobs')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaBriefcase /> Review Hot Jobs
                </div>
              </Link>
            </div>

          </div>
        </div>

        {/* Bottom Section: Actions */}
        <div className="nav-grid">
          <a href="https://www.google.com/maps/d/u/0/edit?mid=1YnckZ2k4jyCu6Agxg4VX0EyWK49puuo&ll=28.284392717060463%2C-82.04171770869505&z=9" target="_blank" rel="noopener noreferrer" className="nav-card">
            <FaMapMarkedAlt />
            <h3>Job Location Map</h3>
          </a>
          <Link to="/job-entry" state={{ from: 'employment' }} className="nav-card">
            <FaBriefcase />
            <h3>Job Entry Form</h3>
          </Link>
          <Link to="/hot-job-search" state={{ from: 'employment' }} className="nav-card" onClick={() => trackStaff('nearby_jobs_search')}>
            <FaSearch />
            <h3>Search for nearby jobs</h3>
          </Link>
          <Link to="/job-seeker-search" className="nav-card">
            <FaUserTie />
            <h3>Search for nearby job seekers</h3>
          </Link>
        </div>



      </div>
    </div>
  );
}

export default EmploymentCenterDashboard;
