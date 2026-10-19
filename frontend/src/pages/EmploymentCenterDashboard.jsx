import { Link, useNavigate } from 'react-router-dom';
import { FaBriefcase, FaUserTie, FaSearch, FaMapMarkedAlt } from 'react-icons/fa';
import { useState, useEffect } from 'react';

function EmploymentCenterDashboard({ user }) {
  const navigate = useNavigate();

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
              <Link to="/assigned-job-seekers" className="btn primary-btn" style={{ width: 'auto', background: '#8e44ad' }}>Show my assigned Job Seekers list</Link>
              <Link to="/hot-jobs-review?category=my_assigned_seekers" className="btn secondary-btn" style={{ width: 'auto', borderColor: '#8e44ad', color: '#8e44ad' }}>Verify Jobs for My Assigned Seekers</Link>
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
              <Link to="/hot-jobs-review" className="btn primary-btn" style={{ background: '#e74c3c', flex: 1 }}>
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
          <Link to="/hot-job-search" state={{ from: 'employment' }} className="nav-card">
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
