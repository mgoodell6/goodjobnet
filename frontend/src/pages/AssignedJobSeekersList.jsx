import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MatchingJobsSection from '../components/MatchingJobsSection';

function AssignedJobSeekersList({ user }) {
  const [loading, setLoading] = useState(true);
  const [seekers, setSeekers] = useState([]);
  const [error, setError] = useState('');
  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);
  const navigate = useNavigate();

  const loadMatchingJobs = useCallback(async (seeker) => {
    setSelectedSeeker(seeker);
    setMatchingJobsLoading(true);
    try {
      const response = await fetch(
        `/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.job_types || seeker.desired_job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`
      );
      const data = await response.json();
      if (data.success) {
        setMatchingJobs(data.results);
      } else {
        alert('Failed to load matching jobs: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while fetching matching jobs.');
    } finally {
      setMatchingJobsLoading(false);
      setTimeout(() => {
        document.getElementById('matching-jobs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, []);

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
                      {seeker.name}
                    </td>
                    <td>{seeker.address || 'N/A'}</td>
                    <td>{seeker.phone || 'N/A'}</td>
                    <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                    <td>{seeker.job_types || 'N/A'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      <a
                        href="#matching-jobs-section"
                        onClick={(e) => {
                          e.preventDefault();
                          loadMatchingJobs(seeker);
                        }}
                        style={{ color: 'var(--primary-color)', textDecoration: 'underline', cursor: 'pointer' }}
                        title="View matching jobs for this job seeker"
                      >
                        {seeker.matching_jobs_count ?? 0}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <MatchingJobsSection
          selectedSeeker={selectedSeeker}
          matchingJobs={matchingJobs}
          matchingJobsLoading={matchingJobsLoading}
        />

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

export default AssignedJobSeekersList;
