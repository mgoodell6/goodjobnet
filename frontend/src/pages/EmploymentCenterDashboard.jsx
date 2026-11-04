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
    validated_by_counts: {},
    usage_daily: { jsDaily: [], ecDaily: [] },
    seeker_types: {},
    unverified_no_career_count: '...'
  });



  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(prev => ({
            ...prev,
            unverified_jobseekers_count: data.unverified_jobseekers_count !== undefined ? data.unverified_jobseekers_count : (data.expiring_soon ?? '0'),
            new_jobs_count: data.new_jobs_count,
            new_jobs_url: data.new_jobs_url,
            total_hot_jobs: data.total_hot_jobs,
            total_job_seekers: data.total_job_seekers,
            job_types: data.job_types || {},
            validated_by_counts: data.validated_by_counts || {},
            seeker_types: data.seeker_types || {},
            unverified_no_career_count: data.unverified_no_career_count
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
      });
  }, []);

  useEffect(() => {
    fetch('/api/usage-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(prev => ({
            ...prev,
            usage_daily: {
              jsDaily: data.job_seeker?.daily || [],
              ecDaily: data.employment_center?.daily || []
            }
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching usage stats:', err);
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
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-color)' }}>Hot Jobs Validated (Last 3 Weeks) by Validator</h3>
              {Object.keys(stats.validated_by_counts).length === 0 && (
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>No verified hot jobs found.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(stats.validated_by_counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => {
                    const maxCount = Math.max(...Object.values(stats.validated_by_counts), 1);
                    return (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ width: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }} title={name}>{name}</span>
                        <div style={{ flex: 1, background: '#f0e6f5', borderRadius: '4px', height: '16px', overflow: 'hidden' }}>
                          <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: '#8e44ad', borderRadius: '4px' }}></div>
                        </div>
                        <strong style={{ width: '24px', flexShrink: 0 }}>{count}</strong>
                      </div>
                    );
                  })
                }
              </div>
              <p style={{ margin: '1rem 0 0 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                Total number of Validated Jobs: {Object.values(stats.validated_by_counts).reduce((sum, c) => sum + c, 0)}
              </p>
            </div>
          </div>

          <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', textAlign: 'center', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {/* Stacked bar chart: User selections over last 7 days by usage page */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary-color)' }}>Site Usage - Target Selections (Last 7 Days)</h3>
              {(() => {
                const { jsDaily, ecDaily } = stats.usage_daily;
                const days = [];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  days.push(d);
                }
                const sumFor = (list, key) => {
                  const entry = list.find(e => e.date === key);
                  if (!entry) return 0;
                  return Object.entries(entry).reduce((s, [k, v]) => (k !== 'date' && typeof v === 'number' ? s + v : s), 0);
                };
                const data = days.map(d => {
                  const key = d.toISOString().slice(0, 10);
                  return {
                    label: (d.getMonth() + 1) + '/' + d.getDate(),
                    jsCount: sumFor(jsDaily, key),
                    ecCount: sumFor(ecDaily, key)
                  };
                });
                const maxTotal = Math.max(...data.map(d => d.jsCount + d.ecCount), 1);
                const step = Math.max(1, Math.ceil(maxTotal / 4));
                const yMax = step * 4 >= maxTotal + step ? step * 4 : (Math.ceil(maxTotal / step) + 1) * step;
                const ticks = [];
                for (let t = 0; t <= yMax; t += step) ticks.push(t);
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.6rem' }}>
                      {/* Y-axis labels and gridlines */}
                      <div style={{ position: 'relative', height: '160px', width: '34px', flexShrink: 0 }}>
                        {ticks.map(t => (
                          <span key={t} style={{ position: 'absolute', bottom: `${(t / yMax) * 100}%`, right: '4px', transform: 'translateY(50%)', fontSize: '0.7rem', color: 'var(--text-light)' }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ position: 'relative', height: '160px', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.6rem' }}>
                        {ticks.map(t => (
                          <div key={t} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(t / yMax) * 100}%`, height: '1px', background: 'rgba(0, 0, 0, 0.08)', pointerEvents: 'none' }}></div>
                        ))}
                        {data.map(d => (
                          <div key={d.label} title={`JobSeeker: ${d.jsCount}, Employment Center: ${d.ecCount}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px' }}>
                            <div style={{ width: '24px', height: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              <div style={{ height: `${(d.ecCount / yMax) * 100}%`, background: 'rgba(142, 68, 173, 0.85)', borderRadius: '3px 3px 0 0', position: 'relative', zIndex: 1 }}></div>
                              <div style={{ height: `${(d.jsCount / yMax) * 100}%`, background: 'rgba(231, 76, 60, 0.85)', position: 'relative', zIndex: 1 }}></div>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>{d.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(231, 76, 60, 0.85)', borderRadius: '2px', display: 'inline-block' }}></span>JobSeekerUsage</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: 'rgba(142, 68, 173, 0.85)', borderRadius: '2px', display: 'inline-block' }}></span>EmploymentCenterUsage</span>
                    </div>
                  </div>
                );
              })()}
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
