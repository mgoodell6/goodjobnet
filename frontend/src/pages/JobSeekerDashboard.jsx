import { Link } from 'react-router-dom';
import { FaMapMarkedAlt, FaSearch, FaFileAlt } from 'react-icons/fa';

function JobSeekerDashboard() {
  return (
    <div className="app-container">
      <div className="glass-panel main-form">
        <header>
          <h1>Job Seeker Access</h1>
          <p className="subtitle">Welcome to the Orlando Employment Center Job Bank</p>
        </header>

        <div className="instructions mb-2 text-center">
          <p><strong>Looking for employment?</strong> We are here to help. You can use the map to find active job opportunities near you, or search the available listings.</p>
        </div>

        <div className="nav-grid">
          <a href="https://www.google.com/maps/d/u/0/edit?mid=1YnckZ2k4jyCu6Agxg4VX0EyWK49puuo&ll=28.284392717060463%2C-82.04171770869505&z=9" target="_blank" rel="noopener noreferrer" className="nav-card">
            <FaMapMarkedAlt />
            <h3>Job Location Map</h3>
          </a>
          <Link to="/hot-job-search" className="nav-card">
            <FaSearch />
            <h3>Search for nearby jobs</h3>
          </Link>
        </div>

        <div className="form-footer">
          <p className="footer-text">No one should go through a job search alone. We offer a team of employment coaches, resume assistance, interview preparation, and networking opportunities.</p>
          <div className="footer-quote-container">
            <p className="footer-quote">"We can accomplish so much more together than we can alone."</p>
            <p className="footer-author">- President Russell M. Nelson</p>
          </div>
          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#7f8c8d' }}>
            Orlando Employment Center  - contact us at - <a href="mailto:Orlandoemploymentoffice@gmail.com" style={{ color: '#3498db', textDecoration: 'underline' }}>Orlandoemploymentoffice@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default JobSeekerDashboard;
