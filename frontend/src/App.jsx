import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, createContext, useContext } from 'react';
import { Button, Container, Form, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import Login from './pages/Login';
import GeneralDashboard from './pages/GeneralDashboard';
import JobEntry from './pages/JobEntry';
import JobSeekerEntry from './pages/JobSeekerEntry';
import HotJobSearch from './pages/HotJobSearch';
import JobSeekerSearch from './pages/JobSeekerSearch';
import EmploymentCenterDashboard from './pages/EmploymentCenterDashboard';
import InformationAndHelp from './pages/InformationAndHelp';
import InformationAndHelpPublic from './pages/InformationAndHelpPublic';
import HotJobsReview from './pages/HotJobsReview';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import AssignedJobSeekersList from './pages/AssignedJobSeekersList';
import JobLocationMap from './pages/JobLocationMap';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const updateBounds = () => {
      if (searchRef.current) {
        const rect = searchRef.current.getBoundingClientRect();
        setBounds({ left: rect.left, top: rect.bottom + 8, width: rect.width });
      }
    };
    updateBounds();
    window.addEventListener('resize', updateBounds);
    const resizeObserver = new ResizeObserver(updateBounds);
    if (searchRef.current) resizeObserver.observe(searchRef.current);
    return () => {
      window.removeEventListener('resize', updateBounds);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setResults(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const requestOptions = signal => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_type: 'company', company_name: trimmedQuery }),
        signal
      });
      const seekerOptions = signal => ({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedQuery, job_types: [], address: '', radius: 20 }),
        signal
      });

      try {
        const [jobsResponse, seekersResponse] = await Promise.all([
          fetch('/api/search-jobs', requestOptions(controller.signal)).then(response => response.json()),
          fetch('/api/search-seekers', seekerOptions(controller.signal)).then(response => response.json())
        ]);
        if (!controller.signal.aborted) {
          setResults({ jobs: jobsResponse.success ? jobsResponse.results : null, seekers: seekersResponse.success ? seekersResponse.results : null });
          setLoading(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Global search failed:', error);
          setResults({ jobs: null, seekers: null });
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const jobs = [...(results?.jobs?.recent || []), ...(results?.jobs?.older || [])].slice(0, 6);
  const seekers = [...(results?.seekers?.nearby || []), ...(results?.seekers?.other || [])].slice(0, 6);
  const hasResults = jobs.length > 0 || seekers.length > 0;

  return (
    <div ref={searchRef} className={`nav-search${isSearchFocused ? ' nav-search-focused' : ''}`} role="search">
      <i className="bi bi-search" aria-hidden="true" />
      <Form.Control type="search" placeholder="Search" aria-label="Search" value={query} onFocus={() => setIsSearchFocused(true)} onBlur={() => { if (!query.trim()) setIsSearchFocused(false); }} onChange={event => setQuery(event.target.value)} />
      {query.trim().length >= 2 && bounds && <div className="global-search-results" style={{ left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px` }} role="region" aria-label="Search results">
        {loading ? <div className="global-search-status">Searching jobs and job seekers...</div> : !hasResults ? <div className="global-search-status">No matching jobs or job seekers found.</div> : <>
          {jobs.length > 0 && <section><h2>Jobs</h2>{jobs.map((job, index) => <Link key={`job-${index}`} to="/hot-job-search" className="global-search-result"><span className="global-search-result-icon"><i className="bi bi-briefcase" aria-hidden="true" /></span><span><strong>{job.company}</strong><small>{job.location || 'Job opportunity'}</small></span></Link>)}</section>}
          {seekers.length > 0 && <section><h2>Job Seekers</h2>{seekers.map((seeker, index) => <Link key={`seeker-${index}`} to="/job-seeker-search" className="global-search-result"><span className="global-search-result-icon"><i className="bi bi-person" aria-hidden="true" /></span><span><strong>{seeker.name}</strong><small>{seeker.desired_job_types || seeker.job_needed || 'Job seeker'}{seeker.city ? ` · ${seeker.city}` : ''}</small></span></Link>)}</section>}
        </>}
      </div>}
    </div>
  );
}

// Create context for connection error handling
export const ConnectionContext = createContext();

// Custom hook to handle connection errors
export const useConnectionCheck = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnectionCheck must be used within SystemGuard');
  }
  return context;
};



function TopBar({ user, handleLogout }) {
  const location = useLocation();
  const isPublicPage = !user;
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('goodjobnet_theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.bsTheme = darkMode ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('goodjobnet_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const dashboardPath = user?.role === 'admin' ? '/admin-dashboard' : '/dashboard';
  const accountInitials = user?.name
    ? user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Navbar expand="lg" className={`app-navbar${isPublicPage ? ' landing-navbar' : ''}`} variant="light">
      <Container fluid>
        <Navbar.Brand as={Link} to={user ? dashboardPath : '/'} className="brand">
          <span className="brand-mark">GJ</span>
          <span>
            <span className="brand-wordmark">GoodJobNet</span>
            <span className="brand-tagline">Employment resources</span>
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="goodjobnet-navigation" />
        <Navbar.Collapse id="goodjobnet-navigation">
          {!isPublicPage && <GlobalSearch />}
          <Nav className="app-nav-links">
            <NavDropdown title="Resources" id="resources-menu">
              <NavDropdown.Header>Publicly Accessible</NavDropdown.Header>
              <NavDropdown.Item as={Link} to="/hot-job-search"><i className="bi bi-search me-2" aria-hidden="true" />Find Jobs</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/job-location-map"><i className="bi bi-map me-2" aria-hidden="true" />Job Location Map</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/help-public"><i className="bi bi-question-circle me-2" aria-hidden="true" />{user ? 'Help (Public)' : 'Help'}</NavDropdown.Item>
              {!isPublicPage && <>
                <NavDropdown.Header>GoodJobNet</NavDropdown.Header>
                <NavDropdown.Item as={Link} to={dashboardPath}><i className="bi bi-grid-1x2 me-2" aria-hidden="true" />Dashboard</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/help"><i className="bi bi-question-circle me-2" aria-hidden="true" />Help and Information</NavDropdown.Item>
                {user?.role === 'admin' && <NavDropdown.Item as={Link} to="/job-seeker-search"><i className="bi bi-people me-2" aria-hidden="true" />Find job seekers</NavDropdown.Item>}
                {user?.role === 'admin' && <NavDropdown.Item as={Link} to="/hot-jobs-review"><i className="bi bi-check2-square me-2" aria-hidden="true" />Review hot jobs</NavDropdown.Item>}
                <NavDropdown.Header>Create</NavDropdown.Header>
                <NavDropdown.Item as={Link} to="/job-entry"><i className="bi bi-briefcase me-2" aria-hidden="true" />Add job opportunity</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/job-seeker-entry"><i className="bi bi-person-plus me-2" aria-hidden="true" />Add job seeker</NavDropdown.Item>
              </>}
            </NavDropdown>
          </Nav>
          <div className="user-controls">
            <Button variant="link" className="theme-toggle" onClick={() => setDarkMode(value => !value)} aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}>
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
            </Button>
            {!user ? <>
              {!isPublicPage && <Link className="header-signup" to="/login?mode=signup">Sign up</Link>}
              <Link className="header-login" to="/login">Log in</Link>
            </> : <NavDropdown align="end" className="account-menu" title={<span className="account-trigger"><span className="account-avatar">{accountInitials}</span></span>} id="account-menu">
              <NavDropdown.Header>Signed in as {user.name}</NavDropdown.Header>
              <NavDropdown.Item as={Link} to={dashboardPath}><i className="bi bi-person-circle me-2" aria-hidden="true" />Account home</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/help"><i className="bi bi-question-circle me-2" aria-hidden="true" />Help</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Log out</NavDropdown.Item>
            </NavDropdown>}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function SystemGuard({ user, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [serverOffline, setServerOffline] = useState(false);
  const [lockoutDismissed, setLockoutDismissed] = useState(false);

  useEffect(() => {
    const protectedPaths = ['/dashboard', '/admin-dashboard', '/help', '/job-entry', '/job-seeker-entry', '/hot-jobs-review', '/hot-jobs-5review', '/hot-jobs-46review', '/assigned-job-seekers', '/job-seeker-search'];
    if (!user && protectedPaths.some(path => location.pathname === path || location.pathname.startsWith(`${path}/`))) {
      navigate('/login', { replace: true });
    }
  }, [location.pathname, navigate, user]);

  const triggerConnectionLost = () => {
    setServerOffline(true);
    setLockoutDismissed(false);
  };

  // Override global fetch to handle connection errors site-wide
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (err) {
        console.error('Fetch error caught:', err);
        triggerConnectionLost();
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ triggerConnectionLost }}>
      <>
        {children}
        {serverOffline && !lockoutDismissed && (
          <div className="server-lockout" role="alertdialog" aria-modal="true" aria-labelledby="server-lockout-title">
            <div className="server-lockout-card">
              <div className="server-lockout-icon"><i className="bi bi-cloud-slash" aria-hidden="true" /></div>
              <div className="portal-eyebrow">Connection unavailable</div>
              <h1 id="server-lockout-title">GoodJobNet is temporarily offline</h1>
              <p>The server connection was lost, so this page may not load or save correctly. Check the server and try again.</p>
              <Button variant="primary" className="primary-btn" onClick={() => setLockoutDismissed(true)}>Return to the site</Button>
              <small>This removes the lockout cover, but the page is likely broken until the connection returns.</small>
            </div>
          </div>
        )}
      </>
    </ConnectionContext.Provider>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const handleLogin = async (userData) => {
    if (userData.role === 'admin') {
      try {
        const response = await fetch('/api/dashboard-stats');
        const statsData = await response.json();
        if (statsData.success) {
          setDashboardStats(statsData);
        }
      } catch (err) {
        console.error('Dashboard preload failed:', err);
        setDashboardStats(null);
      }
    } else {
      setDashboardStats(null);
    }
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setDashboardStats(null);
    window.location.href = '/';
  };

  return (
    <Router>
      <SystemGuard user={user}>
        <TopBar user={user} handleLogout={handleLogout} />
        <Routes>
        <Route path="/" element={<JobSeekerDashboard />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard />} />
        <Route path="/job-location-map" element={<JobLocationMap />} />
        <Route path="/help-public" element={<InformationAndHelpPublic user={user} />} />
        <Route path="/hot-job-search" element={<HotJobSearch user={user} />} />
        {user ? (
          <>
            <Route path="/dashboard" element={<GeneralDashboard />} />
            <Route path="/admin-dashboard" element={<EmploymentCenterDashboard user={user} initialStats={dashboardStats} />} />
            <Route path="/help" element={<InformationAndHelp />} />
            <Route path="/job-entry" element={<JobEntry user={user} />} />
            <Route path="/job-seeker-entry" element={<JobSeekerEntry user={user} />} />
            <Route path="/hot-jobs-review" element={<HotJobsReview user={user} />} />
            <Route path="/hot-jobs-5review" element={<HotJobsReview user={user} />} />
            <Route path="/hot-jobs-46review" element={<HotJobsReview user={user} />} />
            <Route path="/assigned-job-seekers" element={<AssignedJobSeekersList user={user} />} />
            <Route path="/job-seeker-search" element={<JobSeekerSearch user={user} />} />
          </>
        ) : (
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        )}
        </Routes>
      </SystemGuard>
    </Router>
  );
}

export default App;
