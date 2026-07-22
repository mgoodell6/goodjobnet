import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { Button, Container, Nav, Navbar, Badge, NavDropdown } from 'react-bootstrap';
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
import AssignedJobSeekersList from './pages/AssignedJobSeekersList';

// Manual Version Configuration - Update this string to change the application version displayed in the header

const APP_VERSION = "Beta v0.20";

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
  const isJobSeekerDashboard = location.pathname === '/' || location.pathname === '/job-seeker-dashboard';
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('goodjobnet_theme') === 'dark');

  useEffect(() => {
    document.documentElement.dataset.bsTheme = darkMode ? 'dark' : 'light';
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('goodjobnet_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (!user || isJobSeekerDashboard) {
    return null;
  }

  return (
    <Navbar expand="lg" className="app-navbar" variant="dark">
      <Container fluid="lg">
        <Navbar.Brand as={Link} to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'} className="brand">
          <span className="brand-mark">GJ</span>
          <span>
            GoodJobNet <Badge bg="warning" text="dark" className="version-badge">{APP_VERSION}</Badge>
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="goodjobnet-navigation" />
        <Navbar.Collapse id="goodjobnet-navigation">
          <Nav className="me-auto">
            <Nav.Link as={Link} to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'}>Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/hot-job-search">Find jobs</Nav.Link>
            {user.role === 'admin' && <Nav.Link as={Link} to="/job-seeker-search">Find job seekers</Nav.Link>}
            <NavDropdown title={<><i className="bi bi-plus-lg me-2" aria-hidden="true" />Add</>} id="add-menu">
              <NavDropdown.Item as={Link} to="/job-entry"><i className="bi bi-briefcase me-2" aria-hidden="true" />Job opportunity</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/job-seeker-entry"><i className="bi bi-person-plus me-2" aria-hidden="true" />Job seeker</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={Link} to="/help">Help</Nav.Link>
          </Nav>
          <div className="user-controls">
            <span className="welcome-text">Welcome, {user.name}</span>
            <Button variant="outline-light" size="sm" onClick={() => setDarkMode(value => !value)} aria-label={darkMode ? 'Use light mode' : 'Use dark mode'}>
              <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon-stars'} me-2`} aria-hidden="true" />{darkMode ? 'Light' : 'Dark'}
            </Button>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Logout
            </Button>
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
    if (!user && protectedPaths.some(path => location.pathname.startsWith(path))) {
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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <SystemGuard user={user}>
        <TopBar user={user} handleLogout={handleLogout} />
        <Routes>
        <Route path="/" element={<JobSeekerDashboard />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/job-seeker-dashboard" element={<JobSeekerDashboard />} />
        <Route path="/hot-job-search" element={<HotJobSearch user={user} />} />
        {user ? (
          <>
            <Route path="/dashboard" element={<GeneralDashboard />} />
            <Route path="/admin-dashboard" element={<EmploymentCenterDashboard user={user} />} />
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
