import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Grid3X3, CircleHelp, ArrowRight, LogOut, X, ChevronRight } from 'lucide-react';
import { visibleApps, launcher } from './navigation';

function HeaderSearch({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') || '');
  return <form className="universal-search-box" role="search" onSubmit={e => { e.preventDefault(); navigate('/search?q=' + encodeURIComponent(query.trim())); }}>
    <Search size={19} />
    <input id="workspace-search" aria-label={user ? 'Search jobs, people, and apps' : 'Search jobs and apps'} placeholder={user ? 'Search jobs, people, and apps' : 'Search jobs and apps'} value={query} onChange={e => setQuery(e.target.value)} />
    <kbd>Ctrl K</kbd><button type="submit" className="icon-button" aria-label="Search"><ArrowRight size={17} /></button>
  </form>;
}

export default function Shell({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [panelState, setPanelState] = useState(null);
  const panel = panelState?.routeKey === location.key ? panelState.kind : null;
  const setPanel = kind => setPanelState(kind ? { kind, routeKey: location.key } : null);
  const panelRef = useRef(null);
  const available = visibleApps(user);
  const active = available.find(a => a.path === location.pathname);
  const routeNames = { '/dashboard': 'Home', '/employment-dashboard': 'Home', '/job-seeker-dashboard': 'Home', '/job-entry': 'Add opportunity', '/job-seeker-entry': location.state?.seeker ? 'Job seeker details' : 'Add job seeker', '/hot-jobs-5review': 'Expiring jobs', '/hot-jobs-46review': 'Expired jobs', '/search': 'Search', '/create': 'Create' };
  const pageTitle = active?.title || (location.pathname === '/apps' ? 'Apps' : routeNames[location.pathname]) || 'Page not found';
  const railPath = location.pathname.includes('review') ? '/hot-jobs-review' : location.pathname === '/job-seeker-entry' && location.state?.seeker ? '/job-seeker-search' : ['/job-entry', '/job-seeker-entry'].includes(location.pathname) ? '/create' : ['/dashboard', '/employment-dashboard', '/job-seeker-dashboard'].includes(location.pathname) ? '/' : location.pathname;
  const jobsArea = ['/hot-job-search', '/map', '/hot-jobs-review', '/hot-jobs-5review', '/hot-jobs-46review', '/job-entry'].includes(location.pathname);
  const peopleArea = ['/job-seeker-search', '/assigned-job-seekers', '/job-seeker-entry'].includes(location.pathname);
  const sectionLinks = jobsArea ? [available.find(a => a.title === 'Jobs'), available.find(a => a.title === 'Job map'), ...(user ? [available.find(a => a.title === 'Review'), { title: 'Add opportunity', path: '/job-entry' }] : [])] : peopleArea && user ? [available.find(a => a.title === 'Job seekers'), available.find(a => a.title === 'My people'), { title: location.state?.seeker ? 'Job seeker details' : 'Add job seeker', path: '/job-seeker-entry' }] : [];
  useEffect(() => {
    const shortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('workspace-search')?.focus(); }
      if (e.key === 'Escape') setPanelState(null);
    };
    const outside = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setPanelState(null); };
    document.addEventListener('keydown', shortcut);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', shortcut); document.removeEventListener('pointerdown', outside); };
  }, []);
  useEffect(() => { document.title = pageTitle + ' | GoodJobNet'; }, [pageTitle]);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [location.pathname]);
  const go = () => setPanel(null);
  return <div className="workspace-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="suite-header" ref={panelRef}>
      <button className="icon-button waffle" aria-label="Open app launcher" aria-expanded={panel === 'apps'} onClick={() => setPanel(panel === 'apps' ? null : 'apps')}><Grid3X3 size={21} /></button>
      <Link to="/" className="suite-brand" onClick={go}><span className="brand-mark"><span /><span /><span /></span>GoodJobNet<span className="beta-label">BETA</span></Link>
      <HeaderSearch key={location.pathname + location.search} user={user} />
      <div className="header-actions"><Link className="icon-button" to="/help" aria-label="Help"><CircleHelp size={20} /></Link>
        {user ? <button className="avatar" aria-label="Account menu" aria-expanded={panel === 'account'} onClick={() => setPanel(panel === 'account' ? null : 'account')}>{user.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase()}</button> : <Link className="sign-in-link" to="/login">Sign in <ArrowRight size={15} /></Link>}
      </div>
      {panel === 'apps' && <div className="launcher-popover"><div className="section-heading"><h2>Your apps</h2><button className="icon-button" aria-label="Close launcher" onClick={go}><X size={18} /></button></div><div className="launcher-grid">{available.map(({ title, path, icon: Icon, color }) => <Link key={path} to={path} onClick={go}><span className={'app-icon ' + color}><Icon size={24} /></span>{title}</Link>)}</div><Link to="/apps" className="text-link" onClick={go}>Explore all apps <ArrowRight size={16} /></Link></div>}
      {panel === 'account' && user && <div className="account-popover"><strong>{user.name}</strong><p>{user.role} {user.ward && '· ' + user.ward}</p>{user.email && <p>{user.email}</p>}<button className="subtle-button" onClick={() => { go(); onLogout(); navigate('/login'); }}><LogOut size={17} /> Sign out</button></div>}
    </header>
    <nav className="app-rail" aria-label="Main navigation">{[...available.filter(a => !['Administration', 'Help'].includes(a.title)), launcher].map(({ title, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} className={'rail-item ' + (railPath === path ? 'active' : '')} aria-current={railPath === path ? 'page' : undefined} onClick={go}><Icon size={22} strokeWidth={1.65} /><span>{title}</span></NavLink>)}<NavLink className="rail-item rail-help" to="/help"><CircleHelp size={22} /><span>Help</span></NavLink></nav>
    <main id="main-content" className="workspace-main" key={location.pathname} tabIndex={-1}><div className="workspace-breadcrumb"><span>Orlando Employment Center</span><ChevronRight size={12} /><span>{pageTitle}</span></div>{sectionLinks.length > 0 && <nav className="section-navigation" aria-label={jobsArea ? 'Opportunity tools' : 'People tools'}>{sectionLinks.filter(Boolean).map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive || (item.path === '/hot-jobs-review' && location.pathname.includes('review')) ? 'active' : ''}>{item.title}</NavLink>)}</nav>}<Outlet /></main>
  </div>;
}

