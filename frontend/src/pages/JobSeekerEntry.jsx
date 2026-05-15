import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JobSeekerEntry({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Handle multiple selections for desired_job_types
    const desired_job_types = Array.from(e.target.querySelectorAll('select[name="desired_job_types"] option:checked')).map(el => el.value);
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
      const response = await fetch('/api/submit-seeker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setMessage('Job Seeker successfully added!');
        e.target.reset();
      } else {
        setSuccess(false);
        setMessage(result.error || 'Failed to submit');
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
          <h1>Job Seeker Entry</h1>
          <p className="subtitle">Enter information for an individual seeking employment</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Name of Job Seeker <span className="required">*</span></label>
              <input type="text" name="name" required />
            </div>

            <div className="input-group full-width">
              <label>Street Address</label>
              <input type="text" name="street" />
            </div>

            <div className="input-group">
              <label>City <span className="required">*</span></label>
              <input type="text" name="city" required />
            </div>

            <div className="input-group">
              <label>Zipcode <span className="required">*</span></label>
              <input type="text" name="zipcode" required />
            </div>

            <div className="input-group">
              <label>Ward</label>
              <input type="text" name="ward" />
            </div>

            <div className="input-group">
              <label>Stake</label>
              <input type="text" name="stake" />
            </div>

            <div className="input-group">
              <label>Phone</label>
              <input type="tel" name="phone" />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" />
            </div>

            <div className="input-group full-width">
              <label>Desired Company Type for employer</label>
              <select name="job_needed">
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
              <label>Desired Job type(s) (Hold Ctrl/Cmd to select multiple)</label>
              <select name="desired_job_types" multiple size="4">
                <option value="">Select Type...</option>
                <option value="A/C Repair">A/C Repair</option>
                <option value="Accountant">Accountant</option>
                <option value="Airport (Baggage/customer service/ground ops)">Airport (Baggage/customer service/ground ops)</option>
                <option value="Auto Parts">Auto Parts</option>
                <option value="Car Wash Attendant">Car Wash Attendant</option>
                <option value="CDL Driver">CDL Driver</option>
                <option value="Cement Mason/finisher">Cement Mason/finisher</option>
                <option value="Computer Programmer">Computer Programmer</option>
                <option value="Corrections">Corrections</option>
                <option value="Custodian">Custodian</option>
                <option value="Delivery Driver">Delivery Driver</option>
                <option value="Drywaller">Drywaller</option>
                <option value="Educator">Educator</option>
                <option value="Electrician">Electrician</option>
                <option value="Grocery Store">Grocery Store</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Hotel/Hospitality">Hotel/Hospitality</option>
                <option value="Information Technology (IT)">Information Technology</option>
                <option value="Landscaping">Landscaping</option>
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
                <option value="Telemarketing">Telemarketing</option>
                <option value="Theme Park">Theme Park</option>
                <option value="Trucking/Transportation">Trucking/Transportation</option>
                <option value="Warehousing/Logistics">Warehousing/Logistics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-group full-width">
              <label>General Notes</label>
              <textarea name="general_notes" rows="3" placeholder="Any additional notes..."></textarea>
            </div>

            <div className="input-group full-width">
              <label>Employment Center Assistance Requested?</label>
              <div className="checkbox-group">
                <input type="checkbox" id="resume_assistance" name="resume_assistance" />
                <label htmlFor="resume_assistance" style={{ margin: 0, fontWeight: 400 }}>Resume assistance</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="interview_coaching" name="interview_coaching" />
                <label htmlFor="interview_coaching" style={{ margin: 0, fontWeight: 400 }}>Interview coaching</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="job_search_assistance" name="job_search_assistance" />
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
            <button type="button" className="btn secondary-btn" onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>Cancel</button>
            <button type="submit" className="btn primary-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Job Seeker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobSeekerEntry;
