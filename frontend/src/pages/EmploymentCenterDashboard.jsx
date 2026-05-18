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
    total_job_seekers: '...',
    job_types: {},
    seeker_types: {}
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
            total_job_seekers: data.total_job_seekers,
            job_types: data.job_types || {},
            seeker_types: data.seeker_types || {}
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

  const getSharedColorMap = () => {
    const map = new Map();
    map.set('Other', '#95a5a6');
    
    let jobTypesArr = Object.entries(stats.job_types || {}).map(([l, c]) => ({ label: l, count: c })).sort((a, b) => b.count - a.count).slice(0, 5);
    let seekerTypesArr = Object.entries(stats.seeker_types || {}).map(([l, c]) => ({ label: l, count: c })).sort((a, b) => b.count - a.count).slice(0, 5);
    
    const allLabels = [...new Set([...jobTypesArr.map(t => t.label), ...seekerTypesArr.map(t => t.label)])];
    const palette = ['#3a7bd5', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#2980b9', '#27ae60', '#e67e22'];
    
    let colorIndex = 0;
    allLabels.forEach(label => {
      if (label !== 'Other' && !map.has(label)) {
        map.set(label, palette[colorIndex % palette.length]);
        colorIndex++;
      }
    });
    
    return map;
  };

  const sharedColorMap = getSharedColorMap();

  const renderPieChart = (typeCounts, total, colorMap) => {
    if (!typeCounts || Object.keys(typeCounts).length === 0) return null;
    
    let typesArr = Object.entries(typeCounts).map(([label, count]) => ({ label, count }));
    typesArr.sort((a, b) => b.count - a.count);
    
    let topTypes = typesArr.slice(0, 5);
    let otherCount = typesArr.slice(5).reduce((acc, curr) => acc + curr.count, 0);
    
    const existingOtherIdx = topTypes.findIndex(t => t.label === "Other");
    if (existingOtherIdx !== -1) {
      otherCount += topTypes[existingOtherIdx].count;
      topTypes.splice(existingOtherIdx, 1);
    }
    
    if (otherCount > 0) {
      topTypes.push({ label: "Other", count: otherCount });
    }
    
    let gradientStops = [];
    let currentPercent = 0;
    
    const validTotal = Math.max(1, typesArr.reduce((sum, item) => sum + item.count, 0));
    
    const legendItems = topTypes.map((t, idx) => {
      const percentage = Math.round((t.count / validTotal) * 100);
      const nextPercent = currentPercent + percentage;
      const color = colorMap.get(t.label) || '#333';
      gradientStops.push(`${color} ${currentPercent}% ${nextPercent}%`);
      currentPercent = nextPercent;
      
      return (
        <span key={t.label} style={{ color: color }}>■ {t.label} ({percentage}%)</span>
      );
    });
    
    if (gradientStops.length > 0) {
      const lastStop = gradientStops[gradientStops.length - 1];
      gradientStops[gradientStops.length - 1] = lastStop.replace(/\d+%$/, '100%');
    }
    
    const background = gradientStops.length > 0 
      ? `conic-gradient(${gradientStops.join(', ')})`
      : 'conic-gradient(#bdc3c7 0% 100%)';
      
    return (
      <>
        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: background, margin: '0 auto 1rem' }}></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          {legendItems}
        </div>
      </>
    );
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
            {renderPieChart(stats.job_types, stats.total_hot_jobs, sharedColorMap)}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              <Link to="/hot-job-search" className="btn secondary-btn mt-2" style={{ width: 'auto', display: 'inline-block' }}>Query Hot Jobs</Link>
              <button onClick={handleUpdateSnapshot} disabled={updatingSnapshot} className="btn primary-btn mt-2" style={{ width: 'auto', display: 'inline-block', background: '#2ecc71' }}>
                {updatingSnapshot ? 'Updating...' : 'Update Snapshot'}
              </button>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Job Seekers by Desired Type</h3>
            <p style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '1rem' }}>Total Job Seekers: {stats.total_job_seekers}</p>
            {renderPieChart(stats.seeker_types, stats.total_job_seekers, sharedColorMap)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <Link to="/job-seeker-matches-report" className="btn primary-btn" style={{ width: 'auto', background: '#8e44ad' }}>View Job Seeker Matches Report</Link>
              <a href="https://docs.google.com/spreadsheets/d/1BCkpZ2S_Covnh-cc5mg8auKWeKOfqubT/edit" target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ width: 'auto' }}>Go to Job Seekers Sheet</a>
            </div>
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
