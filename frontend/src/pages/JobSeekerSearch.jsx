import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const JOB_OPTIONS = [
  "HVAC Repair", "Accountant", "Airport (Baggage/customer service/ground ops)",
  "Auto Parts", "Car Wash Attendant", "Cashier", "Catering", "CDL Driver",
  "Cement Mason/finisher", "Computer / IT", "Computer Programmer", "Construction",
  "Corrections", "Custodian", "Customer service", "Data Entry", "Day Care / Preschool",
  "Delivery Driver", "Drywaller", "Educator", "Electrician", "Engineering",
  "Event Staff", "Fast food", "Gas Station Attendant", "Grocery Store",
  "Healthcare", "Hotel/Hospitality", "Housekeeper", "Information Technology (IT)",
  "Landscaping", "Manager (Department/Project)", "Manager (Store/Crew)", "Mechanic",
  "Manufacturing", "Nursing", "Painter", "Pest Control", "Plumbing",
  "Restaurant (Cook/Waiter/Host)", "Retail", "Sales", "Security", "Stocking",
  "Telephone/Call Center/Scheduling", "Theme Park", "Trucking/Transportation",
  "Warehousing/Logistics"
];

function JobSeekerSearch({ user }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [savedInputs, setSavedInputs] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_inputs');
    return saved ? JSON.parse(saved) : { name: '', job_types: [], address: '', radius: '20', other_job_type: '' };
  });

  const [results, setResults] = useState(null);
  const [selectedJobTypes, setSelectedJobTypes] = useState(savedInputs.job_types || []);

  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  const loadMatchingJobs = useCallback(async (seeker) => {
    setSelectedSeeker(seeker);
    setMatchingJobsLoading(true);
    try {
      const response = await fetch(`/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.job_types || seeker.desired_job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`);
      const data = await response.json();
      if (data.success) {
        setMatchingJobs(data.results);
      } else {
        alert("Failed to load matching jobs: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error while fetching matching jobs.");
    } finally {
      setMatchingJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (results) {
        const nearbyList = results.nearby || [];
        const otherList = results.other || [];
        const totalCount = nearbyList.length + otherList.length;
        if (totalCount === 1) {
          const singleSeeker = nearbyList.length === 1 ? nearbyList[0] : otherList[0];
          loadMatchingJobs(singleSeeker);
        } else {
          setSelectedSeeker(null);
          setMatchingJobs({ recent: [], older: [] });
        }
      } else {
        setSelectedSeeker(null);
        setMatchingJobs({ recent: [], older: [] });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results, loadMatchingJobs]);

  const performSearch = useCallback(async (searchParams) => {
    setLoading(true);
    
    // Store inputs in state & session storage
    const inputs = {
      name: searchParams.name || '',
      job_types: searchParams.job_types || [],
      address: searchParams.address || '',
      radius: searchParams.radius || '20',
      other_job_type: searchParams.other_job_type || ''
    };
    setSavedInputs(inputs);
    setSelectedJobTypes(inputs.job_types);
    sessionStorage.setItem('seeker_search_inputs', JSON.stringify(inputs));

    const combinedJobTypes = [...inputs.job_types];
    if (inputs.other_job_type && inputs.other_job_type.trim() !== '') {
      const extraTypes = inputs.other_job_type.split(',').map(s => s.trim()).filter(Boolean);
      combinedJobTypes.push(...extraTypes);
    }

    const data = {
      name: inputs.name,
      job_types: combinedJobTypes,
      address: inputs.address,
      radius: inputs.radius
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
  }, []);

  useEffect(() => {
    if (location.state?.autoSearch) {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');

      const allJobTypes = location.state.jobTypes || [];
      const matched = allJobTypes.filter(j => JOB_OPTIONS.includes(j));
      const unmatched = allJobTypes.filter(j => !JOB_OPTIONS.includes(j));

      const searchParams = {
        name: '',
        job_types: matched,
        address: location.state.address || '',
        radius: '20',
        other_job_type: unmatched.join(', ')
      };

      setTimeout(() => {
        performSearch(searchParams);
      }, 0);
    } else if (location.state?.keepResults) {
      const savedRes = sessionStorage.getItem('seeker_search_results');
      const savedInp = sessionStorage.getItem('seeker_search_inputs');
      setTimeout(() => {
        if (savedRes) {
          setResults(JSON.parse(savedRes));
        }
        if (savedInp) {
          const parsedInp = JSON.parse(savedInp);
          setSavedInputs(parsedInp);
          setSelectedJobTypes(parsedInp.job_types || []);
        }
      }, 0);
    } else {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');
      setTimeout(() => {
        setSavedInputs({ name: '', job_types: [], address: '', radius: '20', other_job_type: '' });
        setSelectedJobTypes([]);
        setResults(null);
      }, 0);
    }
  }, [location.state, performSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobTypes = formData.getAll('job_type');
    const otherJobType = formData.get('other_job_type') || '';
    const name = formData.get('name') || '';
    const address = formData.get('address') || '';
    const radius = formData.get('radius') || '20';

    await performSearch({
      name,
      job_types: jobTypes,
      address,
      radius,
      other_job_type: otherJobType
    });
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
            <div className="input-group full-width">
              <label>Search by Name (Optional - Bypasses job types and location filters)</label>
              <input type="text" name="name" placeholder="Enter seeker name..." defaultValue={savedInputs.name || ''} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.6rem', fontWeight: '500' }}>
                OR, search by job type(s) and radius from given location
              </div>
            </div>

            <div className="input-group">
              <label>Job Type (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                name="job_type" 
                multiple 
                size="4"
                value={selectedJobTypes}
                onChange={e => setSelectedJobTypes(Array.from(e.target.selectedOptions, opt => opt.value))}
              >
                {JOB_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
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
            <button type="button" className="btn secondary-btn" style={{ maxWidth: '300px', marginLeft: '1rem' }} onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>
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
                              <Link to="/job-seeker-entry" state={{ seeker, fromSearch: true }} style={{ color: 'var(--primary-color)', textDecoration: 'none' }} className="seeker-name-link">
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
                              <Link to="/job-seeker-entry" state={{ seeker, fromSearch: true }} style={{ color: 'var(--primary-color)', textDecoration: 'none' }} className="seeker-name-link">
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

            {selectedSeeker && (
              <div className="matching-jobs-section mt-3" style={{ borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Matching Jobs for {selectedSeeker.name}</h2>
                <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                  Based on desired job types: <strong>{selectedSeeker.job_types || selectedSeeker.desired_job_types}</strong>
                </p>
                {matchingJobsLoading ? (
                  <p className="text-center">Loading matching jobs from JobBank...</p>
                ) : (
                  <>
                    <h3 style={{ marginTop: '1.5rem', color: '#2ecc71', borderBottom: '2px solid #2ecc71', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                      Currently Hiring Jobs ({matchingJobs.recent.length})
                    </h3>
                    {matchingJobs.recent.length > 0 ? (
                      <div className="table-container mb-2">
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
                            {matchingJobs.recent.map((job, idx) => (
                              <tr key={idx}>
                                <td>{job.company}</td>
                                <td>{job.role}</td>
                                <td>{job.location}</td>
                                <td>{job.distance || 'N/A'}</td>
                                <td>
                                  {job.career_website ? (
                                    <a href={job.career_website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>
                                      View Posting
                                    </a>
                                  ) : 'N/A'}
                                </td>
                                <td>{job.notes || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>No currently hiring jobs found matching criteria.</p>}

                    <h3 style={{ marginTop: '2rem', color: '#f39c12', borderBottom: '2px solid #f39c12', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
                      Other Jobs Meeting Criteria (Not Currently Hiring) ({matchingJobs.older.length})
                    </h3>
                    {matchingJobs.older.length > 0 ? (
                      <div className="table-container mb-2">
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
                            {matchingJobs.older.map((job, idx) => (
                              <tr key={idx}>
                                <td>{job.company}</td>
                                <td>{job.role}</td>
                                <td>{job.location}</td>
                                <td>{job.distance || 'N/A'}</td>
                                <td>
                                  {job.career_website ? (
                                    <a href={job.career_website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>
                                      View Posting
                                    </a>
                                  ) : 'N/A'}
                                </td>
                                <td>{job.notes || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <p style={{ fontStyle: 'italic', color: 'var(--text-light)' }}>No other matching jobs found.</p>}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JobSeekerSearch;
