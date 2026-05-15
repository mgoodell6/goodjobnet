import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const JOB_OPTIONS = [
  "A/C Repair", "Accountant", "Airport (Baggage/customer service/ground ops)",
  "Auto Parts", "Car Wash Attendant", "CDL Driver", "Cement Mason/finisher",
  "Computer Programmer", "Corrections", "Custodian", "Delivery Driver",
  "Drywaller", "Educator", "Electrician", "Grocery Store", "Healthcare",
  "Hotel/Hospitality", "Information Technology (IT)", "Landscaping",
  "Mechanic", "Manufacturing", "Nursing", "Painter", "Pest Control",
  "Plumbing", "Restaurant (Cook/Waiter/Host)", "Retail", "Sales",
  "Security", "Stocking/Inventory", "Telemarketing", "Theme Park", "Trucking/Transportation",
  "Warehousing/Logistics", "Other"
];

function HotJobsReview({ user }) {
  const [jobs, setJobs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [categorySelected, setCategorySelected] = useState(false);
  const [jobTypeQuery, setJobTypeQuery] = useState('');
  const [reviewTitle, setReviewTitle] = useState('Hot Jobs Review');

  const fetchJobs = (category, type = '') => {
    setLoading(true);
    setCategorySelected(true);

    if (category === '5days') setReviewTitle('Review Jobs Expiring Soon (5 days)');
    else if (category === '46weeks') setReviewTitle('Review Expired Jobs (4-6 weeks)');
    else if (category === 'type') setReviewTitle(`Review Jobs by Type: ${type}`);

    fetch(`/api/hot-jobs-review?category=${category}&type=${encodeURIComponent(type)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJobs(data.jobs);
        } else {
          setMessage(data.error || 'Failed to fetch jobs.');
        }
        setLoading(false);
      })
      .catch(err => {
        setMessage('Error connecting to server.');
        setLoading(false);
      });
  };

  const currentJob = jobs[currentIndex];

  const handleNext = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setMessage('');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.row_index = currentJob.row_index;

    const selectedJobs = formData.getAll('available_jobs_select');
    const manualJobs = data.available_jobs_manual;

    let allJobs = [...selectedJobs];
    if (manualJobs && manualJobs.trim() !== '') {
      allJobs.push(manualJobs.trim());
    }
    data.available_jobs = allJobs.join(', ');

    delete data.available_jobs_select;
    delete data.available_jobs_manual;

    if (user && user.name) {
      data.submitter_name = user.name;
    }

    try {
      const response = await fetch('/api/update-hot-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage('Job successfully updated!');

        // Update local state to reflect changes if needed
        const updatedJobs = [...jobs];
        updatedJobs[currentIndex] = { ...currentJob, ...data };
        setJobs(updatedJobs);
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to update Job.');
      }
    } catch (err) {
      setSuccess(false);
      setMessage('Error connecting to server.');
    }
    setSaving(false);
  };

  if (!categorySelected) {
    return (
      <div className="app-container">
        <div className="glass-panel main-form">
          <header>
            <h1>Review Hot Jobs</h1>
            <p className="subtitle">Select the type of jobs you want to update</p>
          </header>

          <div className="form-grid mt-2">
            <button className="btn primary-btn" onClick={() => fetchJobs('5days')} style={{ height: 'auto', padding: '1.5rem' }}>
              Jobs Expiring in the next 5 days
            </button>
            <button className="btn primary-btn" onClick={() => fetchJobs('46weeks')} style={{ height: 'auto', padding: '1.5rem' }}>
              Jobs that have expired in the last 4-6 weeks
            </button>

            <div className="input-group full-width mt-2" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <label style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Or search by specific Job Type (disregards date & hiring status)</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <select
                  value={jobTypeQuery}
                  onChange={e => setJobTypeQuery(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Select Job Type...</option>
                  {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <button
                  className="btn secondary-btn"
                  onClick={() => jobTypeQuery && fetchJobs('type', jobTypeQuery)}
                  style={{ width: 'auto' }}
                  disabled={!jobTypeQuery}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="actions mt-2" style={{ textAlign: 'center' }}>
            <button type="button" className="btn secondary-btn" onClick={() => navigate('/dashboard')} style={{ width: 'auto' }}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="app-container"><div className="glass-panel main-form"><h2>Loading jobs...</h2></div></div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="app-container">
        <div className="glass-panel main-form">
          <header>
            <h1>{reviewTitle}</h1>
            <p className="subtitle">No jobs found matching this criteria.</p>
          </header>
          <div className="actions mt-2">
            <button type="button" className="btn secondary-btn" onClick={() => { setCategorySelected(false); setJobs([]); }}>Go Back</button>
            <button type="button" className="btn primary-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container fade-in">
      <div className="glass-panel main-form">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{reviewTitle}</h1>
            <p className="subtitle">Review and update hot jobs</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Job {currentIndex + 1} of {jobs.length}</span>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Age: {currentJob.age_days} days
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button type="button" className="btn secondary-btn" onClick={handlePrev} disabled={currentIndex === 0} style={{ width: 'auto' }}>
            &larr; Previous Job
          </button>
          <button type="button" className="btn secondary-btn" onClick={handleNext} disabled={currentIndex === jobs.length - 1} style={{ width: 'auto' }}>
            Next Job &rarr;
          </button>
        </div>

        <form onSubmit={handleSubmit} key={currentJob.row_index}>
          {(() => {
            const existingJobs = (currentJob.available_jobs || '').split(',').map(s => s.trim()).filter(Boolean);
            const matchedJobs = existingJobs.filter(j => JOB_OPTIONS.includes(j));
            const unmatchedJobs = existingJobs.filter(j => !JOB_OPTIONS.includes(j));

            return (
              <div className="form-grid">
                <div className="input-group">
                  <label>Company Name <span className="required">*</span></label>
                  <input type="text" name="company_name" defaultValue={currentJob.company_name} required />
                </div>

                <div className="input-group">
                  <label>Company Type</label>
                  <select name="company_type" defaultValue={currentJob.company_type}>
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
                  <label>Company Street Address <span className="required">*</span></label>
                  <input type="text" name="company_street" defaultValue={currentJob.company_street} required />
                </div>

                <div className="input-group">
                  <label>City <span className="required">*</span></label>
                  <input type="text" name="company_city" defaultValue={currentJob.company_city} required />
                </div>

                <div className="input-group">
                  <label>Company State <span className="required">*</span></label>
                  <select name="company_state" defaultValue={currentJob.company_state || 'FL'} required>
                    <option value="">Select State...</option>
                    <option value="FL">Florida</option>
                    <option value="AL">Alabama</option>
                    <option value="GA">Georgia</option>
                    <option value="TX">Texas</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Company Zipcode <span className="required">*</span></label>
                  <input type="text" name="company_zip" defaultValue={currentJob.company_zip} required />
                </div>

                <div className="input-group full-width">
                  <label>Career Website URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="url" name="career_website" defaultValue={currentJob.career_website} style={{ flex: 1 }} />
                    {currentJob.career_website && (
                      <a href={currentJob.career_website.startsWith('http') ? currentJob.career_website : `https://${currentJob.career_website}`} target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ width: 'auto', padding: '0.8rem 1rem' }}>
                        Open Link
                      </a>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label>Hiring Contact Name</label>
                  <input type="text" name="contact_name" defaultValue={currentJob.contact_name} />
                </div>

                <div className="input-group">
                  <label>Hiring Contact Phone</label>
                  <input type="tel" name="contact_phone" defaultValue={currentJob.contact_phone} />
                </div>

                <div className="input-group">
                  <label>Hiring Contact Email</label>
                  <input type="email" name="contact_email" defaultValue={currentJob.contact_email} />
                </div>

                <div className="input-group">
                  <label>Currently Hiring <span className="required">*</span></label>
                  <select name="currently_hiring" defaultValue={currentJob.currently_hiring} required>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Available Jobs (Select multiple with Ctrl/Cmd, and/or enter manually)</label>
                  <select name="available_jobs_select" multiple size="6" defaultValue={matchedJobs}>
                    {JOB_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <input type="text" name="available_jobs_manual" defaultValue={unmatchedJobs.join(', ')} placeholder="Other available jobs (comma separated)" style={{ marginTop: '0.5rem' }} />
                </div>

                <div className="input-group full-width">
                  <label>Additional Notes</label>
                  <textarea name="notes" rows="2" defaultValue={currentJob.notes}></textarea>
                </div>
              </div>
            );
          })()}

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: success ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: success ? '#27ae60' : '#c0392b' }}>
              {message}
            </div>
          )}

          <div className="actions mt-2 mb-1" style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn secondary-btn" onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>Cancel</button>
            <button type="submit" className="btn primary-btn" disabled={saving}>
              {saving ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default HotJobsReview;
