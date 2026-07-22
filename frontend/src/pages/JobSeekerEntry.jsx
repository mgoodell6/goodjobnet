import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import MultiSelect from '../components/MultiSelect';

const standardOptions = [
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

function JobSeekerEntry({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const seeker = location.state?.seeker;
  const fromSearch = location.state?.fromSearch;
  const fromAssigned = location.state?.fromAssigned;

  const seekerTypes = seeker?.desired_job_types ? seeker.desired_job_types.split(',').map(t => t.trim()) : [];
  const standardSelected = seekerTypes.filter(t => standardOptions.includes(t));
  const customSelected = seekerTypes.filter(t => !standardOptions.includes(t)).join(', ');

  const [selectedJobTypes, setSelectedJobTypes] = useState(standardSelected);

  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  useEffect(() => {
    const loadMatchingJobs = async () => {
      if (!seeker) return;
      setMatchingJobsLoading(true);
      try {
        const response = await fetch(`/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.desired_job_types || seeker.job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`);
        const data = await response.json();
        if (data.success) {
          setMatchingJobs(data.results);
        } else {
          console.error("Failed to load matching jobs:", data.error);
        }
      } catch (err) {
        console.error("Error loading matching jobs:", err);
      } finally {
        setMatchingJobsLoading(false);
      }
    };

    loadMatchingJobs();
  }, [seeker]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Handle multiple selections for desired_job_types
    const desired_job_types = Array.from(e.target.querySelectorAll('select[name="desired_job_types"] option:checked')).map(el => el.value);
    const otherJobType = formData.get('other_job_type');
    if (otherJobType && otherJobType.trim() !== '') {
      desired_job_types.push(otherJobType.trim());
    }
    data.desired_job_types = desired_job_types;

    // Handle checkboxes
    data.resume_assistance = formData.get('resume_assistance') === 'on';
    data.interview_coaching = formData.get('interview_coaching') === 'on';
    data.job_search_assistance = formData.get('job_search_assistance') === 'on';

    if (user) {
      data.submitter_name = user.name;
      data.submitter_ward = user.ward;
      data.submitter_stake = user.stake;
      data.submitter_phone = user.phone;
      data.submitter_email = user.email;
    }

    try {
      const endpoint = (fromSearch || fromAssigned) ? '/api/update-seeker' : '/api/submit-seeker';
      if ((fromSearch || fromAssigned) && seeker?.row_index) {
        data.row_index = seeker.row_index;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage((fromSearch || fromAssigned) ? 'Job Seeker successfully updated!' : 'Job Seeker successfully added!');
        
        if (fromSearch) {
          // Update the sessionStorage cache so the report has the updated seeker data
          try {
            const savedResultsStr = sessionStorage.getItem('seeker_search_results');
            if (savedResultsStr) {
              const savedResults = JSON.parse(savedResultsStr);
              const updateSeekerInList = (list) => {
                if (!list) return list;
                return list.map(s => {
                  if (s.row_index === seeker.row_index) {
                    return {
                      ...s,
                      name: data.name,
                      street: data.street,
                      city: data.city,
                      zipcode: data.zipcode,
                      ward: data.ward,
                      stake: data.stake,
                      phone: data.phone,
                      email: data.email,
                      skills_education: data.skills_education,
                      job_needed: data.job_needed,
                      desired_job_types: data.desired_job_types.join(', '),
                      general_notes: data.general_notes,
                      resume_assistance: data.resume_assistance,
                      interview_coaching: data.interview_coaching,
                      job_search_assistance: data.job_search_assistance,
                      address: [data.street, data.city, data.zipcode].filter(Boolean).join(', ')
                    };
                  }
                  return s;
                });
              };
              if (savedResults.nearby) savedResults.nearby = updateSeekerInList(savedResults.nearby);
              if (savedResults.other) savedResults.other = updateSeekerInList(savedResults.other);
              sessionStorage.setItem('seeker_search_results', JSON.stringify(savedResults));
            }
          } catch (cacheErr) {
            console.error('Failed to update search results cache:', cacheErr);
          }
        } else {
          e.target.reset();
        }
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to submit');
      }
    } catch {
      setSuccess(false);
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <Card className="glass-panel main-form border-0 shadow-sm" style={{ maxWidth: seeker ? '1000px' : '700px' }}>
        <div className="search-hero page-hero">
          <div><div className="portal-eyebrow">GoodJobNet job bank</div><h1 className="mb-2">Add a job seeker</h1><p className="subtitle">Enter information for an individual seeking employment.</p></div>
          <div className="search-hero-icon"><i className="bi bi-person-plus" aria-hidden="true" /></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Name of Job Seeker <span className="required">*</span></label>
              <input type="text" name="name" defaultValue={seeker?.name || ''} required />
            </div>

            <div className="input-group full-width">
              <label>Street Address</label>
              <input type="text" name="street" defaultValue={seeker?.street || ''} />
            </div>

            <div className="input-group">
              <label>City</label>
              <input type="text" name="city" defaultValue={seeker?.city || ''} />
            </div>

            <div className="input-group">
              <label>Zipcode</label>
              <input type="text" name="zipcode" defaultValue={seeker?.zipcode || ''} />
            </div>

            <div className="input-group">
              <label>Ward</label>
              <input type="text" name="ward" defaultValue={seeker?.ward || ''} />
            </div>

            <div className="input-group">
              <label>Stake</label>
              <input type="text" name="stake" defaultValue={seeker?.stake || ''} />
            </div>

            <div className="input-group">
              <label>Phone</label>
              <input type="tel" name="phone" defaultValue={seeker?.phone || ''} />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" defaultValue={seeker?.email || ''} />
            </div>

            <div className="input-group full-width">
              <label>Skills/Education</label>
              <textarea name="skills_education" rows="3" placeholder="Enter skills and education..." defaultValue={seeker?.skills_education || ''}></textarea>
            </div>

            <div className="input-group full-width">
              <label>Desired Company Type for employer</label>
              <select name="job_needed" defaultValue={seeker?.job_needed || ''}>
                <option value="">Select Type...</option>
                <option value="Construction">Construction</option>
                <option value="Driving">Driving</option>
                <option value="Education">Education</option>
                <option value="Government related">Government related</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Janitorial">Janitorial</option>
                <option value="Non-Profit">Non-Profit</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Retail">Retail</option>
                <option value="Technology">Technology</option>
                <option value="Theme Park">Theme Park</option>
              </select>
            </div>

            <div className="input-group full-width">
              <label>Desired Job type(s) (click to select multiple)</label>
              <MultiSelect 
                name="desired_job_types" 
                size="4" 
                options={standardOptions}
                value={selectedJobTypes} 
                onChange={setSelectedJobTypes}
              />
            </div>

            <div className="input-group full-width">
              <label>Other Job Type (Not in list)</label>
              <input type="text" name="other_job_type" placeholder="Enter other job type..." defaultValue={customSelected} />
            </div>

            <div className="input-group full-width">
              <label>General Notes</label>
              <textarea name="general_notes" rows="3" placeholder="Any additional notes..." defaultValue={seeker?.general_notes || ''}></textarea>
            </div>

            <div className="input-group full-width">
              <label>Employment Center Assistance Requested?</label>
              <div className="checkbox-group">
                <input type="checkbox" id="resume_assistance" name="resume_assistance" defaultChecked={seeker?.resume_assistance} />
                <label htmlFor="resume_assistance" style={{ margin: 0, fontWeight: 400 }}>Resume assistance</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="interview_coaching" name="interview_coaching" defaultChecked={seeker?.interview_coaching} />
                <label htmlFor="interview_coaching" style={{ margin: 0, fontWeight: 400 }}>Interview coaching</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="job_search_assistance" name="job_search_assistance" defaultChecked={seeker?.job_search_assistance} />
                <label htmlFor="job_search_assistance" style={{ margin: 0, fontWeight: 400 }}>Job Search assistance</label>
              </div>
            </div>
          </div>

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: success ? '#27ae60' : '#c0392b' }}>
              {message}
            </div>
          )}

          <div className="actions mt-2 mb-1" style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn secondary-btn" 
              onClick={() => {
                if (fromAssigned) {
                  navigate('/assigned-job-seekers');
                } else if (fromSearch) {
                  navigate('/job-seeker-search', { state: { keepResults: true } });
                } else if (seeker) {
                  navigate('/job-seeker-search', { state: { keepResults: true } });
                } else {
                  navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard');
                }
              }}
            >
              {(fromSearch || fromAssigned) ? 'Return to report' : 'Cancel'}
            </button>
            <button 
              type="submit" 
              className="btn primary-btn" 
              disabled={loading || (!!seeker && !(fromSearch || fromAssigned))}
            >
              {loading ? 'Submitting...' : ((fromSearch || fromAssigned) ? 'Submit changes' : 'Submit Job Seeker')}
            </button>
          </div>
        </form>

        {seeker && (
          <div className="matching-jobs-section mt-3" style={{ borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
            <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Matching Jobs for {seeker.name}</h2>
            <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Based on desired job types: <strong>{seeker.desired_job_types || seeker.job_types}</strong>
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
                            <td>
                              <Link 
                                to={`/hot-jobs-review?category=company&company=${encodeURIComponent(job.company)}`} 
                                state={{ seeker, fromEntry: true, fromAssigned, fromSearch }}
                                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                              >
                                {job.company}
                              </Link>
                            </td>
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
                            <td>
                              <Link 
                                to={`/hot-jobs-review?category=company&company=${encodeURIComponent(job.company)}`} 
                                state={{ seeker, fromEntry: true, fromAssigned, fromSearch }}
                                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                              >
                                {job.company}
                              </Link>
                            </td>
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
      </Card>
    </div>
  );
}

export default JobSeekerEntry;
