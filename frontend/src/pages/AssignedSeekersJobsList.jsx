import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AssignedSeekersJobsList({ user }) {
  const [loading, setLoading] = useState(true);
  const [seekers, setSeekers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllMatchingJobs = async () => {
      if (!user?.name) {
        setError('User session not found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/assigned-seekers-matching-jobs?coach=${encodeURIComponent(user.name)}`);
        const result = await response.json();
        if (result.success) {
          setSeekers(result.results || []);
        } else {
          setError(result.error || 'Failed to fetch matching jobs for assigned seekers.');
        }
      } catch (err) {
        console.error(err);
        setError('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllMatchingJobs();
  }, [user]);

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1050px' }}>
        <header>
          <h1>Currently Hiring Jobs for My Assigned Seekers</h1>
          <p className="subtitle">
            Matching currently hiring jobs for coach: <strong>{user?.name || 'Unknown'}</strong>
          </p>
        </header>

        {loading ? (
          <p className="text-center">Loading matching jobs for assigned seekers...</p>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.2)', color: '#c0392b', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        ) : seekers.length === 0 ? (
          <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            No job seekers are currently assigned to you.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '1.5rem' }}>
            {seekers.map((seeker, sIdx) => (
              <section
                key={sIdx}
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '2px solid #8e44ad', paddingBottom: '0.5rem' }}>
                  <h2 style={{ margin: 0, color: '#8e44ad', fontSize: '1.25rem' }}>
                    {seeker.name}
                  </h2>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    Desired Job Types: <strong>{seeker.job_types || 'N/A'}</strong> &bull; {seeker.jobs.length} currently hiring {seeker.jobs.length === 1 ? 'job' : 'jobs'}
                  </span>
                </div>

                {seeker.jobs.length === 0 ? (
                  <p style={{ fontStyle: 'italic', color: 'var(--text-light)', margin: '0.5rem 0 0' }}>
                    No currently hiring jobs match this job seeker&apos;s desired job types.
                  </p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Company</th>
                          <th>Address</th>
                          <th>Open Job Positions</th>
                          <th>Career Site</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seeker.jobs.map((job, jIdx) => (
                          <tr key={jIdx}>
                            <td style={{ fontWeight: '600' }}>{job.company}</td>
                            <td>{job.address || 'N/A'}</td>
                            <td>{job.available_jobs || 'N/A'}</td>
                            <td>
                              {job.career_website ? (
                                <a
                                  href={job.career_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'var(--primary-color)', textDecoration: 'underline', fontWeight: '500' }}
                                >
                                  View Career Site
                                </a>
                              ) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}

        <div className="actions mt-2 text-center">
          <button
            type="button"
            className="btn secondary-btn"
            style={{ maxWidth: '300px' }}
            onClick={() => navigate('/employment-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignedSeekersJobsList;
