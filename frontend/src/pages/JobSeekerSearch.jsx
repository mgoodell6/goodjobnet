import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function JobSeekerSearch() {
  const [loading, setLoading] = useState(false);
  
  const [savedInputs, setSavedInputs] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_inputs');
    return saved ? JSON.parse(saved) : { job_types: [], address: '', radius: '20', other_job_type: '' };
  });

  const [results, setResults] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_results');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedJobTypes, setSelectedJobTypes] = useState(savedInputs.job_types);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const jobTypes = formData.getAll('job_type');
    const otherJobType = formData.get('other_job_type');
    
    // Store inputs in state & session storage
    const inputs = {
      job_types: jobTypes,
      address: formData.get('address') || '',
      radius: formData.get('radius') || '20',
      other_job_type: otherJobType || ''
    };
    setSavedInputs(inputs);
    sessionStorage.setItem('seeker_search_inputs', JSON.stringify(inputs));

    const combinedJobTypes = [...jobTypes];
    if (otherJobType && otherJobType.trim() !== '') {
      combinedJobTypes.push(otherJobType.trim());
    }

    const data = {
      job_types: combinedJobTypes,
      address: formData.get('address'),
      radius: formData.get('radius')
    };

    try {
      const response = await fetch('/api/search-seekers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();

      if (resultData.success) {
        setResults(resultData.results);
        sessionStorage.setItem('seeker_search_results', JSON.stringify(resultData.results));
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
          <h1>Job Seeker Search</h1>
          <p className="subtitle">Find unemployed individuals interested in a job type within a certain radius of an address</p>
        </header>

        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="input-group">
              <label>Job Type (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                name="job_type" 
                multiple 
                size="4"
                value={selectedJobTypes}
                onChange={e => setSelectedJobTypes(Array.from(e.target.selectedOptions, opt => opt.value))}
              >
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
              <label>Find individuals near this location (Street, City, Zipcode)</label>
              <textarea name="address" rows="4" placeholder="Enter full address including zip code... (e.g. 32801)" defaultValue={savedInputs.address}></textarea>
            </div>

            <div className="input-group">
              <label>Other Job Type (Not in list)</label>
              <input type="text" name="other_job_type" placeholder="Enter other job type..." defaultValue={savedInputs.other_job_type} />
            </div>

            <div className="input-group">
              <label>List individuals within radius of (miles)</label>
              <input type="number" name="radius" defaultValue={savedInputs.radius || '20'} min="1" required />
            </div>
          </div>

          <div className="actions mt-2 text-center">
            <button type="submit" className="btn primary-btn" style={{ maxWidth: '300px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Look for potential job seekers'}
            </button>
            <button type="button" className="btn secondary-btn" style={{ maxWidth: '300px', marginLeft: '1rem' }} onClick={() => navigate('/admin-dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </form>

        {results && (
          <div className="results-section mt-2">
            <h2>Search Results</h2>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.4rem', marginBottom: '0.8rem', color: 'var(--primary-color)' }}>
                Job Seekers Within Radius ({results.nearby ? results.nearby.length : 0})
              </h3>
              {(() => {
                const list = results.nearby;
                if (!list || list.length === 0) {
                  return <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>No job seekers found matching the criteria within the specified radius.</p>;
                }
                return (
                  <div className="table-container mb-2">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Job Types</th>
                          <th>Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((seeker, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 'bold' }}>
                              <Link to="/job-seeker-entry" state={{ seeker }} style={{ color: 'var(--primary-color)', textDecoration: 'none' }} className="seeker-name-link">
                                {seeker.name}
                              </Link>
                            </td>
                            <td>{seeker.address || 'N/A'}</td>
                            <td>{seeker.phone ? <a href={`tel:${seeker.phone}`}>{seeker.phone}</a> : 'N/A'}</td>
                            <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                            <td>{seeker.job_types}</td>
                            <td>
                              {typeof seeker.distance === 'number'
                                ? `${seeker.distance} mile${seeker.distance === 1 ? '' : 's'}`
                                : seeker.distance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ borderBottom: '2px solid var(--secondary-color)', paddingBottom: '0.4rem', marginBottom: '0.8rem', color: 'var(--secondary-color)' }}>
                Other Matching Job Seekers (Outside Radius or Address Not Provided) ({results.other ? results.other.length : 0})
              </h3>
              {(() => {
                const list = results.other;
                if (!list || list.length === 0) {
                  return <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>No other matching job seekers found.</p>;
                }
                return (
                  <div className="table-container mb-2">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Job Types</th>
                          <th>Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((seeker, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 'bold' }}>
                              <Link to="/job-seeker-entry" state={{ seeker }} style={{ color: 'var(--primary-color)', textDecoration: 'none' }} className="seeker-name-link">
                                {seeker.name}
                              </Link>
                            </td>
                            <td>{seeker.address || 'N/A'}</td>
                            <td>{seeker.phone ? <a href={`tel:${seeker.phone}`}>{seeker.phone}</a> : 'N/A'}</td>
                            <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                            <td>{seeker.job_types}</td>
                            <td>
                              {typeof seeker.distance === 'number'
                                ? `${seeker.distance} mile${seeker.distance === 1 ? '' : 's'}`
                                : seeker.distance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSeekerSearch;
