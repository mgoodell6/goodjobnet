import { Link, useNavigate } from 'react-router-dom';
import { FaBriefcase, FaUserTie, FaSearch } from 'react-icons/fa';
import { useState, useEffect } from 'react';

function EmploymentCenterDashboard() {
  const navigate = useNavigate();

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
    seeker_types: {},
    unverified_no_career_count: '...'
  });

  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  const handleUpdateJobSeekerInfo = () => {
    setUpdating(true);
    setUpdateStatus(null);
    setImportStatus(null);
    fetch('/api/update-jobseeker-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setUpdating(false);
        if (data.success) {
          setUpdateStatus({ success: true, message: data.message });
          fetch('/api/dashboard-stats')
            .then(res => res.json())
            .then(statsData => {
              if (statsData.success) {
                setStats(prev => ({
                  ...prev,
                  total_hot_jobs: statsData.total_hot_jobs,
                  total_job_seekers: statsData.total_job_seekers,
                  job_types: statsData.job_types || {},
                  seeker_types: statsData.seeker_types || {},
                  expiring_soon: statsData.expiring_soon,
                  two_years_soon: statsData.two_years_soon,
                  new_jobs_count: statsData.new_jobs_count,
                  new_seekers_count: statsData.new_seekers_count,
                  expired_recently: statsData.expired_recently,
                  unverified_no_career_count: statsData.unverified_no_career_count
                }));
              }
            });
        } else {
          setUpdateStatus({ success: false, message: data.error || 'Failed to update.' });
        }
      })
      .catch(err => {
        setUpdating(false);
        setUpdateStatus({ success: false, message: 'Network error occurred.' });
        console.error('Error updating jobseeker info:', err);
      });
  };

  const handleImportJobSeekers = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    setUpdateStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/import-jobseekers', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        setImporting(false);
        e.target.value = '';
        if (data.success) {
          setImportStatus({ success: true, message: data.message });
          fetch('/api/dashboard-stats')
            .then(res => res.json())
            .then(statsData => {
              if (statsData.success) {
                setStats({
                  expiring_soon: statsData.expiring_soon,
                  two_years_soon: statsData.two_years_soon,
                  new_jobs_count: statsData.new_jobs_count,
                  new_jobs_url: statsData.new_jobs_url,
                  new_seekers_count: statsData.new_seekers_count,
                  new_seekers_url: statsData.new_seekers_url,
                  expired_recently: statsData.expired_recently,
                  total_hot_jobs: statsData.total_hot_jobs,
                  total_job_seekers: statsData.total_job_seekers,
                  job_types: statsData.job_types || {},
                  seeker_types: statsData.seeker_types || {},
                  unverified_no_career_count: statsData.unverified_no_career_count
                });
              }
            });
        } else {
          setImportStatus({ success: false, message: data.error || 'Failed to import.' });
        }
      })
      .catch(err => {
        setImporting(false);
        e.target.value = '';
        setImportStatus({ success: false, message: 'Network error occurred.' });
        console.error('Error importing job seekers:', err);
      });
  };

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
            seeker_types: data.seeker_types || {},
            unverified_no_career_count: data.unverified_no_career_count
          });
        }
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
  }, []);



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

  const renderPieChart = (typeCounts, total, colorMap, emptyMessage = "No active data") => {
    if (total === '...') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '210px' }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'conic-gradient(#f6f8fb 0% 100%)',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--text-light)',
            opacity: 0.5
          }}>
            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Loading...</span>
          </div>
        </div>
      );
    }

    if (!typeCounts || Object.keys(typeCounts).length === 0 || total === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '210px' }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'conic-gradient(#e5ebf1 0% 100%)',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #bdc3c7'
          }}>
            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontWeight: '500' }}>No Data</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
            {emptyMessage}
          </div>
        </div>
      );
    }

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
            {renderPieChart(stats.job_types, stats.total_hot_jobs, sharedColorMap, "No hot jobs currently active")}

          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>Job Seekers by Desired Type</h3>
            <p style={{ fontWeight: 'bold', color: 'var(--text-color)', marginBottom: '1rem' }}>Total Job Seekers: {stats.total_job_seekers}</p>
            {renderPieChart(stats.seeker_types, stats.total_job_seekers, sharedColorMap, "No job seekers currently active")}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <Link to="/job-seeker-matches-report" className="btn primary-btn" style={{ width: 'auto', background: '#8e44ad' }}>View Job Seeker Matches Report</Link>
            </div>
          </div>
        </div>

        {/* Middle Section: Alerts */}
        <div className="alerts-section mb-2" style={{ background: 'rgba(231, 76, 60, 0.05)', border: '1px solid rgba(231, 76, 60, 0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#c0392b', marginBottom: '1rem' }}>Attention Needed</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Link to="/hot-jobs-5review" className="dashboard-alert-link">
                <span>Hot Jobs expiring in 5 days:</span>
                <strong>{stats.expiring_soon}</strong>
              </Link>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Link to="/hot-jobs-46review" className="dashboard-alert-link">
                <span>Hot Jobs that expired 4 - 6 weeks ago:</span>
                <strong>{stats.expired_recently}</strong>
              </Link>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Link to="/hot-jobs-review?category=unverified_no_career" className="dashboard-alert-link">
                <span>Hot Jobs unverified &gt; 3 weeks (Phone Verification Required):</span>
                <strong>{stats.unverified_no_career_count}</strong>
              </Link>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>JobBank rows reaching 2 years in next 3 months:</span>
              <strong>{stats.two_years_soon}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>New unreviewed Job Opportunities:</span>
              <strong>{stats.new_jobs_count}</strong>
            </li>
            <li style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>New unreviewed Job Seekers:</span>
              <strong>{stats.new_seekers_count}</strong>
            </li>
          </ul>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/hot-jobs-review" className="btn primary-btn" style={{ background: '#e74c3c', flex: 1 }}>
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
          <Link to="/hot-job-search" className="nav-card">
            <FaSearch />
            <h3>Search for nearby jobs</h3>
          </Link>
          <Link to="/job-seeker-search" className="nav-card">
            <FaUserTie />
            <h3>Search for nearby job seekers</h3>
          </Link>
          <Link to="/job-seeker-entry" className="nav-card">
            <FaUserTie />
            <h3>Job Seeker Entry</h3>
          </Link>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            <button 
              className="btn primary-btn" 
              onClick={handleUpdateJobSeekerInfo} 
              disabled={updating}
              style={{ 
                flex: 1,
                maxWidth: '420px', 
                background: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
                boxShadow: '0 4px 15px rgba(46, 125, 50, 0.3)'
              }}
            >
              {updating ? 'Updating jobBank jobSeeker information...' : 'Update jobBank jobSeeker information'}
            </button>

            <label 
              className="btn primary-btn" 
              style={{ 
                flex: 1,
                maxWidth: '420px', 
                background: 'linear-gradient(135deg, #3a7bd5, #3a6073)',
                boxShadow: '0 4px 15px rgba(58, 123, 213, 0.3)',
                cursor: importing ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                opacity: importing ? 0.7 : 1
              }}
            >
              {importing ? 'Importing current Job Seeker List...' : 'Import current Job Seeker List'}
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={handleImportJobSeekers} 
                disabled={importing}
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {(updateStatus || importStatus) && (
            <p style={{ 
              fontSize: '0.95rem', 
              fontWeight: 500, 
              color: (updateStatus?.success || importStatus?.success) ? 'var(--success)' : 'var(--error)',
              marginTop: '0.25rem',
              textAlign: 'center'
            }}>
              {updateStatus ? updateStatus.message : importStatus.message}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default EmploymentCenterDashboard;
