import { Link } from 'react-router-dom';
import { FaBriefcase, FaUserTie, FaMapMarkedAlt, FaSearch, FaFileAlt } from 'react-icons/fa';

function GeneralDashboard() {
  return (
    <div className="app-container">
      <div className="glass-panel main-form">
        <header>
          <h1>General User Dashboard</h1>
          <p className="subtitle">Coordinate with the Orlando Employment Center</p>
        </header>

        <div className="instructions mb-2 text-center">
          <p><strong>Potential Job Opportunities:</strong> We encourage church members to share employment opportunities that they are aware of. These opportunities will be shared with those who are actively seeking jobs through the Orlando Employment Center.</p>
          <p><strong>Job Seekers:</strong> Information entered in this website is sent to the Orlando Employment Center where we can help leverage resources and tools to help individuals find stable employment.</p>
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

        <div className="nav-grid" style={{ marginTop: '1rem' }}>
          <Link to="/job-entry" className="nav-card">
            <FaBriefcase />
            <h3>Job Opportunity Entry</h3>
          </Link>
          <Link to="/job-seeker-entry" className="nav-card">
            <FaUserTie />
            <h3>Job Seeker Entry</h3>
          </Link>
          <Link to="/resume-coach" className="nav-card">
            <FaFileAlt />
            <h3>Virtual Resume Coach</h3>
          </Link>
        </div>

        <div className="form-footer">
          <p className="footer-text">No one should go through a job search alone. We offer a team of experts, support groups, webinars, workshops, and other resources.</p>
          <div className="footer-quote-container">
            <p className="footer-quote">"We can accomplish so much more together than we can alone."</p>
            <p className="footer-author">- President Russell M. Nelson</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralDashboard;
