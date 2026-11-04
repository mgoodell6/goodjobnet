import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function JobEntry({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    let careerWebsite = data.career_website ? data.career_website.trim() : '';
    if (careerWebsite) {
      if (!/^https?:\/\//i.test(careerWebsite)) {
        careerWebsite = 'https://' + careerWebsite;
      }
      data.career_website = careerWebsite;
    }

    // Normalize the comma-separated job titles (trim each, drop empties)
    data.available_jobs = (data.available_jobs || '')
      .split(',')
      .map(j => j.trim())
      .filter(Boolean)
      .join(', ');

    const selectedConsiderations = formData.getAll('special_considerations');
    data.special_considerations = selectedConsiderations.join(', ');

    const enteredName = data.submitter_name ? data.submitter_name.trim() : '';
    data.submitter_name = enteredName || user?.name || '';
    data.entered_by_name = data.submitter_name;

    if (user) {
      data.submitter_ward = user.ward || '';
      data.submitter_stake = user.stake || '';
      data.submitter_phone = user.phone || '';
      data.submitter_email = user.email || '';
    }

    try {
      const response = await fetch('/api/submit-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage('Job successfully added to database!');
        e.target.reset();
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to submit Job.');
      }
    } catch (err) {
      setSuccess(false);
      setMessage('Error connecting to server.');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="glass-panel main-form">
        <header>
          <h1>Job Entry Form</h1>
          <p className="subtitle">Submit new potential jobs to the Orlando Employment Center</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="input-group">
              <label>Company Name <span className="required">*</span></label>
              <input type="text" name="company_name" required />
            </div>

            <div className="input-group">
              <label>Company Type</label>
              <input type="text" name="company_type" list="company-types" placeholder="Enter or select type..." />
              <datalist id="company-types">
                <option value="Call Center" />
                <option value="Construction" />
                <option value="Driving" />
                <option value="Education" />
                <option value="Fast Food" />
                <option value="Government related" />
                <option value="Healthcare" />
                <option value="Hospitality" />
                <option value="Janitorial" />
                <option value="Non-Profit" />
                <option value="Restaurant" />
                <option value="Retail" />
                <option value="Services" />
                <option value="Technology" />
                <option value="Theme Park" />
                <option value="Vocation careers (HVAC, plumbing, electrical, etc)" />
              </datalist>
            </div>

            <div className="input-group full-width">
              <label>Company Street Address <span className="required">*</span></label>
              <input type="text" name="company_street" required />
            </div>

            <div className="input-group">
              <label>City <span className="required">*</span></label>
              <input type="text" name="company_city" required />
            </div>

            <div className="input-group">
              <label>Company State <span className="required">*</span></label>
              <select name="company_state" required>
                <option value="">Select State...</option>
                <option value="FL">Florida</option>
                {/* Simplified for demo, add all states as needed */}
                <option value="AL">Alabama</option>
                <option value="GA">Georgia</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                <option value="CA">California</option>
              </select>
            </div>

            <div className="input-group">
              <label>Company Zipcode <span className="required">*</span></label>
              <input type="text" name="company_zip" required />
            </div>



            <div className="input-group">
              <label>Career Website URL</label>
              <input type="text" name="career_website" />
            </div>

            <div className="input-group">
              <label>Hiring Contact Name</label>
              <input type="text" name="contact_name" />
            </div>

            <div className="input-group">
              <label>Hiring Contact Phone</label>
              <input type="tel" name="contact_phone" />
            </div>

            <div className="input-group">
              <label>Hiring Contact Email</label>
              <input type="email" name="contact_email" />
            </div>



            <div className="input-group primary-field-highlight">
              <label htmlFor="currently_hiring">Currently Hiring <span className="required">*</span></label>
              <select id="currently_hiring" name="currently_hiring" required defaultValue="Yes">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="input-group full-width primary-field-highlight">
              <label htmlFor="available_jobs">Available Jobs</label>
              <input
                type="text"
                id="available_jobs"
                name="available_jobs"
                placeholder="Enter available job titles, comma separated (e.g. Cashier, Stocking, Delivery Driver)"
              />
              <small className="primary-field-hint">Separate multiple job titles with commas.</small>
            </div>

            <div className="input-group full-width">
              <label>Special Considerations</label>
              <div className="checkbox-options-grid">
                <label className="checkbox-card-label">
                  <input 
                    type="checkbox" 
                    name="special_considerations" 
                    value="Entry Level Position" 
                  />
                  <span>Entry Level Position</span>
                </label>
                <label className="checkbox-card-label">
                  <input 
                    type="checkbox" 
                    name="special_considerations" 
                    value="Background Challenges OK" 
                  />
                  <span>Background Challenges OK</span>
                </label>
                <label className="checkbox-card-label">
                  <input 
                    type="checkbox" 
                    name="special_considerations" 
                    value="Limited English OK" 
                  />
                  <span>Limited English OK</span>
                </label>
              </div>
            </div>

            <div className="input-group full-width">
              <label>Additional Notes</label>
              <textarea name="notes" rows="2"></textarea>
            </div>

            <div className="input-group full-width">
              <label>Name of person entering new job information <span className="required">*</span></label>
              <input 
                type="text" 
                name="submitter_name" 
                defaultValue={user?.name || ''} 
                placeholder="Enter your name..." 
                required 
              />
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
                if (location.state?.from === 'employment' && user?.role === 'admin') {
                  navigate('/employment-dashboard');
                } else {
                  navigate('/');
                }
              }}
            >
              Return to Dashboard
            </button>
            <button type="submit" className="btn primary-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobEntry;
