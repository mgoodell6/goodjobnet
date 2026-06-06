import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HotJobSearch({ user }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const jobTypes = formData.getAll('job_type');
    const otherJobType = formData.get('other_job_type');
    if (otherJobType && otherJobType.trim() !== '') {
      jobTypes.push(otherJobType.trim());
    }

    const data = {
      job_types: jobTypes,
      address: formData.get('address'),
      radius: formData.get('radius'),
      company_name: formData.get('company_name')
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
          <h1>Job Search</h1>
          <p className="subtitle">Find potential jobs based on radius and job type</p>
        </header>

        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="input-group">
              <label>Job Type (Hold Ctrl/Cmd to select multiple)</label>
              <select name="job_type" multiple size="4">
                <option value="HVAC Repair">HVAC Repair</option>
                <option value="Accountant">Accountant</option>
                <option value="Airport (Baggage/customer service/ground ops)">Airport (Baggage/customer service/ground ops)</option>
                <option value="Auto Parts">Auto Parts</option>
                <option value="Car Wash Attendant">Car Wash Attendant</option>
                <option value="Cashier">Cashier</option>
                <option value="Catering">Catering</option>
                <option value="CDL Driver">CDL Driver</option>
                <option value="Cement Mason/finisher">Cement Mason/finisher</option>
                <option value="Computer / IT">Computer / IT</option>
                <option value="Computer Programmer">Computer Programmer</option>
                <option value="Construction">Construction</option>
                <option value="Corrections">Corrections</option>
                <option value="Custodian">Custodian</option>
                <option value="Customer service">Customer service</option>
                <option value="Data Entry">Data Entry</option>
                <option value="Day Care / Preschool">Day Care/ Preschool</option>
                <option value="Delivery Driver">Delivery Driver</option>
                <option value="Drywaller">Drywaller</option>
                <option value="Educator">Educator</option>
                <option value="Electrician">Electrician</option>
                <option value="Engineering">Engineering</option>
                <option value="Event Staff">Event Staff</option>
                <option value="Fast food">Fast food</option>
                <option value="Gas Station Attendant">Gas Station Attendant</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hotel/Hospitality">Hotel/Hospitality</option>
                <option value="Housekeeper">Housekeeper</option>
                <option value="Information Technology (IT)">Information Technology (IT)</option>
                <option value="Landscaping">Landscaping</option>
                <option value="Manager (Department/Project)">Manager (Department/Project)</option>
                <option value="Manager (Store/Crew)">Manager (Store/Crew)</option>
                <option value="Mechanic">Mechanic</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Nursing">Nursing</option>
                <option value="Painter">Painter</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Restaurant (Cook/Waiter/Host)">Restaurant (Cook/Waiter/Host)</option>
                <option value="Retail">Retail</option>
                <option value="Sales">Sales</option>
                <option value="Security">Security</option>
                <option value="Stocking">Stocking</option>
                <option value="Telephone/Call Center/Scheduling">Telephone/Call Center/Scheduling</option>
                <option value="Theme Park">Theme Park</option>
                <option value="Trucking/Transportation">Trucking/Transportation</option>
                <option value="Warehousing/Logistics">Warehousing/Logistics</option>
              </select>
            </div>

            <div className="input-group">
              <label>Find a job near this location (Street, City, Zipcode)</label>
              <textarea name="address" rows="4" placeholder="Enter full address..."></textarea>
            </div>

            <div className="input-group">
              <label>Company Name (Optional)</label>
              <input type="text" name="company_name" placeholder="Search by company name..." />
            </div>

            <div className="input-group">
              <label>Other Job Type (Not in list)</label>
              <input type="text" name="other_job_type" placeholder="Enter other job type..." />
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
            <button type="button" className="btn secondary-btn" style={{ maxWidth: '300px', marginLeft: '1rem' }} onClick={() => {
              if (user) {
                navigate(user.role === 'admin' ? '/admin-dashboard' : '/dashboard');
              } else {
                navigate('/');
              }
            }}>
              {user ? 'Back to Dashboard' : 'Back to Job Seeker Dashboard'}
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
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.recent.map((job, idx) => (
                      <tr key={idx}>
                        <td>{job.company}</td>
                        <td>{job.role}</td>
                        <td>{job.location}</td>
                        <td>{job.distance || 'N/A'}</td>
                        <td>
                          {job.career_website ? (
                            <a href={job.career_website} target="_blank" rel="noopener noreferrer">View Posting</a>
                          ) : 'N/A'}
                        </td>
                        <td>{job.notes || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p>No recent jobs found.</p>}

            <h3 style={{ marginTop: '2rem', color: '#f39c12' }}>Other Potential Jobs (Older than 3 weeks that were hiring previously)</h3>
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
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.older.map((job, idx) => (
                      <tr key={idx}>
                        <td>{job.company}</td>
                        <td>{job.role}</td>
                        <td>{job.location}</td>
                        <td>{job.distance || 'N/A'}</td>
                        <td>
                          {job.career_website ? (
                            <a href={job.career_website} target="_blank" rel="noopener noreferrer">View Posting</a>
                          ) : 'N/A'}
                        </td>
                        <td>{job.notes || 'N/A'}</td>
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
