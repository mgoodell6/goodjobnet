import { Link, useNavigate } from 'react-router-dom';
import { FaBriefcase, FaUserTie, FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';

function EmploymentCenterDashboard() {
  const navigate = useNavigate();
  const [updatingSnapshot, setUpdatingSnapshot] = useState(false);
  const [stats, setStats] = useState({
    expiring_soon: '...',
    two_years_soon: '...',
    new_jobs_count: '...',
    new_jobs_url: '#',
    new_seekers_count: '...',
    new_seekers_url: '#',
    expired_recently: '...',
    total_hot_jobs: '...',
    total_job_seekers: '...'
  });

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats({
            expiring_soon: data.expiring_soon,
            two_years_soon: data.two_years_soon,
            new_jobs_count: data.new_jobs_count,
            new_jobs_url: data.new_jobs_url,
            new_seekers_count: data.new_seekers_count,
            new_seekers_url: data.new_seekers_url,
            expired_recently: data.expired_recently,
            total_hot_jobs: data.total_hot_jobs,
            total_job_seekers: data.total_job_seekers
          });
        }
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
  }, []);

  const handleUpdateSnapshot = async () => {
    setUpdatingSnapshot(true);
    try {
      const response = await fetch('/api/update-snapshot', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(result.message || 'Snapshot successfully updated!');
      } else {
        alert('Failed to update snapshot: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
    setUpdatingSnapshot(false);
  };

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1000px' }}>
        <header>
          <h1>Employment Center Dashboard</h1>
          <p className="subtitle">Metrics and Management for Orlando Employment Center</p>
        </header>

        {/* Top Section: Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Hot Jobs by Industry</h3>
            <p style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '1rem' }}>Total Hot Jobs: {stats.total_hot_jobs}</p>
            {/* Pseudo-chart representation */}
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#3a7bd5 0% 40%, #2ecc71 40% 70%, #e74c3c 70% 90%, #f39c12 90% 100%)', margin: '0 auto 1rem' }}></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#3a7bd5' }}>■ Technology (40%)</span>
              <span style={{ color: '#2ecc71' }}>■ Healthcare (30%)</span>
              <span style={{ color: '#e74c3c' }}>■ Retail (20%)</span>
              <span style={{ color: '#f39c12' }}>■ Other (10%)</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <Link to="/hot-job-search" className="btn secondary-btn mt-2" style={{ width: 'auto', display: 'inline-block' }}>Query Hot Jobs</Link>
              <button onClick={handleUpdateSnapshot} disabled={updatingSnapshot} className="btn primary-btn mt-2" style={{ width: 'auto', display: 'inline-block', background: '#2ecc71' }}>
                {updatingSnapshot ? 'Updating...' : 'Update Snapshot'}
              </button>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Job Seekers by Desired Type</h3>
            <p style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '1rem' }}>Total Job Seekers: {stats.total_job_seekers}</p>
            {/* Pseudo-chart representation */}
            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'conic-gradient(#8e44ad 0% 50%, #3498db 50% 85%, #1abc9c 85% 100%)', margin: '0 auto 1rem' }}></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#8e44ad' }}>■ Technology (50%)</span>
              <span style={{ color: '#3498db' }}>■ Finance (35%)</span>
              <span style={{ color: '#1abc9c' }}>■ Services (15%)</span>
            </div>
            <a href="https://docs.google.com/spreadsheets/d/1BCkpZ2S_Covnh-cc5mg8auKWeKOfqubT/edit" target="_blank" rel="noopener noreferrer" className="btn secondary-btn mt-2" style={{ width: 'auto' }}>Go to Job Seekers Sheet</a>
          </div>
        </div>

        {/* Middle Section: Alerts */}
        <div className="alerts-section mb-2" style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#c0392b', marginBottom: '1rem' }}>Attention Needed</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Hot Jobs expiring in 5 days:</span>
              <strong>{stats.expiring_soon}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Hot Jobs that expired 4 - 6 weeks ago:</span>
              <strong>{stats.expired_recently}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>JobBank rows reaching 2 years in next 3 months:</span>
              <strong>{stats.two_years_soon}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>New unreviewed Job Opportunities:</span>
              <strong>{stats.new_jobs_count}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
              <span>New unreviewed Job Seekers:</span>
              <strong>{stats.new_seekers_count}</strong>
            </li>
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/hot-jobs-review" className="btn primary-btn" style={{ background: '#e74c3c' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <FaBriefcase /> Review Hot Jobs
                </div>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href={stats.new_jobs_url} target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ flex: 1, fontSize: '0.9rem' }}>
                Review New Job Opportunities
              </a>
              {stats.new_seekers_url ? (
                <a href={stats.new_seekers_url} target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ flex: 1, fontSize: '0.9rem' }}>
                  Review New Job Seekers
                </a>
              ) : (
                <button disabled className="btn secondary-btn" style={{ flex: 1, fontSize: '0.9rem', opacity: 0.5 }}>
                  Review New Job Seekers
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Actions */}
        <div className="nav-grid">
          <Link to="/job-entry" className="nav-card">
            <FaBriefcase />
            <h3>Job Entry Form</h3>
          </Link>
          <Link to="/job-seeker-entry" className="nav-card">
            <FaUserTie />
            <h3>Job Seeker Form</h3>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default EmploymentCenterDashboard;
