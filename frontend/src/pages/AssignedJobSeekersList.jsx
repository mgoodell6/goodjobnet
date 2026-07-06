import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function AssignedJobSeekersList({ user }) {
  const [loading, setLoading] = useState(true);
  const [seekers, setSeekers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedSeekers = async () => {
      if (!user?.name) {
        setError('User session not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/assigned-seekers?coach=${encodeURIComponent(user.name)}`);
        const result = await response.json();
        if (result.success) {
          setSeekers(result.results || []);
        } else {
          setError(result.error || 'Failed to fetch assigned seekers.');
        }
      } catch (err) {
        console.error(err);
        setError('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedSeekers();
  }, [user]);

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1000px' }}>
        <header>
          <h1>Assigned Job Seekers List</h1>
          <p className="subtitle">Unemployed individuals assigned to coach: <strong>{user?.name || 'Unknown'}</strong></p>
        </header>

        {loading ? (
          <p className="text-center">Loading assigned seekers...</p>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.2)', color: '#c0392b', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        ) : seekers.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            No job seekers are currently assigned to you.
          </p>
        ) : (
          <div className="table-container mb-2">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Job Types</th>
                  <th>Matching Jobs</th>
                </tr>
              </thead>
              <tbody>
                {seekers.map((seeker, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>
                      <Link 
                        to="/job-seeker-entry" 
                        state={{ seeker, fromSearch: true }} 
                        style={{ color: 'var(--primary-color)', textDecoration: 'none' }} 
                        className="seeker-name-link"
                      >
                        {seeker.name}
                      </Link>
                    </td>
                    <td>{seeker.address || 'N/A'}</td>
                    <td>{seeker.phone ? <a href={`tel:${seeker.phone}`}>{seeker.phone}</a> : 'N/A'}</td>
                    <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                    <td>{seeker.job_types || 'N/A'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{seeker.matching_jobs_count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="actions mt-2 text-center">
          <button 
            type="button" 
            className="btn secondary-btn" 
            style={{ maxWidth: '300px' }} 
            onClick={() => navigate('/admin-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignedJobSeekersList;
