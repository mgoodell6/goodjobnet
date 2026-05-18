import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function JobSeekerMatchesReport() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/job-seeker-matches-report');
        const result = await response.json();
        if (result.success) {
          setReportData(result.report);
        } else {
          setError(result.error || 'Failed to fetch report');
        }
      } catch (err) {
        setError('Error connecting to server.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1000px' }}>
        <header>
          <h1>Job Seeker Matches Report</h1>
          <p className="subtitle">Overview of Unemployed List and available Hot Jobs within a 20-mile radius</p>
          <div style={{ marginTop: '1rem' }}>
            <a href="https://docs.google.com/spreadsheets/d/1nI1GA-ajJmZncYzYPSsTY10LXKgyd43dBIYLFsUec2w/edit" target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ display: 'inline-block', width: 'auto' }}>
              View Exported Google Sheet
            </a>
          </div>
        </header>

        {loading ? (
          <p className="text-center">Loading report (this may take a moment)...</p>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(231, 76, 60, 0.2)', color: '#c0392b', borderRadius: '8px' }}>
            {error}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Skills / Education</th>
                  <th>Desired Job Types</th>
                  <th>Hot Jobs within 20 miles</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.name}</td>
                    <td>{row.address}</td>
                    <td>{row.skills}</td>
                    <td>{row.desired_types}</td>
                    <td style={{ fontWeight: 'bold', color: typeof row.hot_jobs_count === 'number' && row.hot_jobs_count > 0 ? '#2ecc71' : 'inherit' }}>
                      {row.hot_jobs_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="actions mt-2 text-center">
          <button type="button" className="btn secondary-btn" style={{ maxWidth: '300px' }} onClick={() => navigate('/admin-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobSeekerMatchesReport;
