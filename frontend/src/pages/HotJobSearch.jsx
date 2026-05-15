import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HotJobSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const data = {
      job_types: formData.getAll('job_type'),
      address: formData.get('address'),
      radius: formData.get('radius')
    };

    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();
      
      if (resultData.success) {
        setResults(resultData.results);
      } else {
        alert('Search failed: ' + (resultData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error - Is your backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <div className="glass-panel main-form" style={{ maxWidth: '1000px' }}>
        <header>
          <h1>Hot Job Search</h1>
          <p className="subtitle">Find potential jobs based on radius and job type</p>
        </header>

        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="input-group">
              <label>Job Type (Hold Ctrl/Cmd to select multiple)</label>
              <select name="job_type" multiple size="4">
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Construction">Construction</option>
                <option value="Services">Services</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label>Address (Street, City, Zipcode)</label>
              <textarea name="address" rows="4" placeholder="Enter full address..."></textarea>
            </div>

            <div className="input-group">
              <label>List jobs within radius of (miles)</label>
              <input type="number" name="radius" defaultValue="20" min="1" />
            </div>
          </div>

          <div className="actions mt-2 text-center">
            <button type="submit" className="btn primary-btn" style={{ maxWidth: '300px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Look for potential jobs'}
            </button>
            <button type="button" className="btn secondary-btn" style={{ maxWidth: '300px', marginLeft: '1rem' }} onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </form>

        {results && (
          <div className="results-section mt-2">
            <h2>Search Results</h2>
            
            <h3 style={{ marginTop: '1.5rem', color: '#2ecc71' }}>Current Jobs (Validated in last 3 weeks)</h3>
            {results.recent.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Distance</th>
                      <th>Career Website</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recent.map((job, idx) => (
                      <tr key={idx}>
                        <td>{job.company}</td>
                        <td>{job.role}</td>
                        <td>{job.location}</td>
                        <td>{job.distance}</td>
                        <td>
                          {job.career_website ? (
                            <a href={job.career_website} target="_blank" rel="noopener noreferrer">View Posting</a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>No recent jobs found.</p>}

            <h3 style={{ marginTop: '2rem', color: '#f39c12' }}>Other Potential Jobs (Older than 3 weeks)</h3>
            {results.older.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Distance</th>
                      <th>Career Website</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.older.map((job, idx) => (
                      <tr key={idx}>
                        <td>{job.company}</td>
                        <td>{job.role}</td>
                        <td>{job.location}</td>
                        <td>{job.distance}</td>
                        <td>
                          {job.career_website ? (
                            <a href={job.career_website} target="_blank" rel="noopener noreferrer">View Posting</a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>No older potential jobs found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default HotJobSearch;
