import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Users, ClipboardCheck, MapPin, Plus, Clock3, LayoutGrid, HeartHandshake } from 'lucide-react';
import { visibleApps } from '../components/navigation';

function Breakdown({ title, values = {}, total, color }) {
  const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(e => Number(e[1])));
  return <section className="surface breakdown"><div className="section-heading"><h2>{title}</h2><span className="muted">{total ?? '—'} total</span></div>{entries.length ? entries.slice(0, 5).map(([label, count]) => <div className="bar-row" key={label}><div><span>{label}</span><strong>{count}</strong></div><div className="bar-track"><span style={{ width: (Number(count) / max * 100) + '%', background: color }} /></div></div>) : <p className="muted">No industry data to display yet.</p>}{entries.length > 5 && <details className="industry-details"><summary>View all industries</summary>{entries.slice(5).map(([label, count]) => <div className="metric-line" key={label}><span>{label}</span><strong>{count}</strong></div>)}</details>}</section>;
}

export default function Home({ user }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All apps');
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetch('/api/dashboard-stats', { signal: controller.signal }).then(r => r.json()).then(data => {
      if (!data.success) throw new Error('Dashboard information is unavailable.');
      setStats(data);
    }).catch(e => { if (e.name !== 'AbortError') setError('Dashboard information could not be loaded. Refresh to try again.'); });
    return () => controller.abort();
  }, [user]);
  const shortcuts = visibleApps(user).filter(a => a.title !== 'Home' && (filter === 'All apps' || (filter === 'Opportunities' ? ['Jobs', 'Job map', 'Review'].includes(a.title) : ['Job seekers', 'My people', 'Help'].includes(a.title))));
  const metrics = [
    { label: 'Active job opportunities', value: stats?.total_hot_jobs, icon: BriefcaseBusiness, color: 'blue', path: '/hot-job-search', detail: 'Explore the job bank' },
    { label: 'People seeking employment', value: stats?.total_job_seekers, icon: Users, color: 'teal', path: '/job-seeker-search', detail: 'Make a connection' },
    { label: 'Jobs expiring in 5 days', value: stats?.expiring_soon, icon: ClipboardCheck, color: 'purple', path: '/hot-jobs-5review', detail: 'Review opportunities' },
  ];
  return <div className="home-page">
    <section className="welcome-banner"><div className="ribbon-art" aria-hidden="true"><i /><i /><i /></div><div className="welcome-copy"><p className="eyebrow">GOOD PEOPLE. NEW POSSIBILITIES.</p><h1>{user ? 'Welcome back, ' + user.name.split(' ')[0] : 'Your next chapter starts here.'}</h1><p>{user ? 'A little connection can make a big difference. Let’s get to work.' : 'Find local opportunities and the support to move forward.'}</p><div className="welcome-actions"><Link className="solid-button" to={user ? '/assigned-job-seekers' : '/hot-job-search'}>{user ? 'Go to my people' : 'Explore jobs'}<ArrowRight size={17} /></Link><Link className="text-link" to={user ? '/create' : '/help'}>{user ? 'Create new' : 'How we can help'}{user ? <Plus size={16} /> : <ArrowRight size={16} />}</Link></div></div><span className="region-label"><MapPin size={14} /> Central Florida</span></section>
    <div className="home-content">
      <div className="section-heading"><h2>{user ? 'Your community at a glance' : 'A good place to start'}</h2><span className="muted">Orlando Employment Center</span></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="feature-grid">{user ? metrics.map(({ label, value, icon: Icon, color, path, detail }) => <Link className="metric-card surface" key={label} to={path}><div className="metric-top"><span className={'app-icon ' + color}><Icon size={24} /></span><span>{label}</span></div><strong className="metric-value">{value ?? (error ? '—' : '…')}</strong><div className="metric-footer">{detail}<ArrowRight size={16} /></div></Link>) : <>
        <Link className="feature-card surface" to="/hot-job-search"><div className="feature-illustration jobs-art"><BriefcaseBusiness size={62} strokeWidth={1.1} /><span /><span /></div><div><h3>Find your next opportunity</h3><p>Explore local jobs by role, employer, and distance.</p><span className="text-link">Search jobs <ArrowRight size={16} /></span></div></Link>
        <Link className="feature-card surface" to="/map"><div className="feature-illustration map-art"><MapPin size={62} strokeWidth={1.1} /><span /><span /></div><div><h3>Discover what’s nearby</h3><p>See employment opportunities across Central Florida.</p><span className="text-link">Explore the map <ArrowRight size={16} /></span></div></Link>
        <Link className="feature-card surface" to="/help"><div className="feature-illustration people-art"><HeartHandshake size={62} strokeWidth={1.1} /><span /><span /></div><div><h3>You don’t have to do it alone</h3><p>Get support with resumes, interviews, and your job search.</p><span className="text-link">Find support <ArrowRight size={16} /></span></div></Link>
      </>}</div>
      <section className="quick-access"><div className="section-heading"><h2>Quick access</h2><Link className="text-link" to="/apps">View all apps <ArrowRight size={15} /></Link></div><div className="filter-pills" aria-label="Quick access categories">{['All apps', 'Opportunities', 'People & support'].map((label, i) => <button key={label} className={filter === label ? 'selected' : ''} aria-pressed={filter === label} onClick={() => setFilter(label)}>{i === 0 ? <LayoutGrid size={15} /> : i === 1 ? <BriefcaseBusiness size={15} /> : <Users size={15} />}{label}</button>)}</div><div className="quick-list surface">{shortcuts.map(({ title, path, icon: Icon, color, description }) => <Link to={path} key={path} className="quick-row"><span className={'app-icon small ' + color}><Icon size={20} /></span><strong>{title}</strong><span className="quick-description">{description}</span><ArrowUpRight size={17} /></Link>)}</div></section>
      {user && <div className="dashboard-lower"><div className="breakdown-column"><Breakdown title="Hot jobs by industry" values={stats?.job_types} total={stats?.total_hot_jobs} color="#6264c7" /><Breakdown title="Job seekers by desired type" values={stats?.seeker_types} total={stats?.total_job_seekers} color="#168a88" /></div><section className="surface attention-card"><div className="section-heading"><h2><Clock3 size={18} /> Attention needed</h2><span className="status-badge">Review queue</span></div>{[
        ['Expiring in the next 5 days', stats?.expiring_soon, '/hot-jobs-5review'],
        ['Expired 4–6 weeks ago', stats?.expired_recently, '/hot-jobs-46review'],
        ['Unverified over 3 years · phone required', stats?.unverified_no_career_count, '/hot-jobs-review?category=unverified_no_career'],
        ['Reaching 2 years in the next 3 months', stats?.two_years_soon],
        ['New job opportunities', stats?.new_jobs_count, '/admin-page'],
        ['New job seekers', stats?.new_seekers_count, '/admin-page'],
      ].map(([label, count, path]) => path ? <Link className="attention-row" key={label} to={path}><span>{label}</span><strong>{count ?? '—'}</strong><ArrowRight size={15} /></Link> : <div className="attention-row" key={label}><span>{label}</span><strong>{count ?? '—'}</strong></div>)}<Link to="/hot-jobs-review" className="text-link">Open review workspace <ArrowRight size={16} /></Link></section></div>}
      <footer className="workspace-footer"><span>GoodJobNet · Orlando Employment Center</span><span>Better opportunities. Stronger connections.</span><Link to="/help">Information & help</Link></footer>
    </div>
  </div>;
}
