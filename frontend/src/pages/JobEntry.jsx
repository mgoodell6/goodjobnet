import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JobEntry({ user }) {
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

    const selectedJobs = formData.getAll('available_jobs_select');
    const manualJobs = data.available_jobs_manual;

    let allJobs = [...selectedJobs];
    if (manualJobs && manualJobs.trim() !== '') {
      allJobs.push(manualJobs.trim());
    }
    data.available_jobs = allJobs.join(', ');

    delete data.available_jobs_select;
    delete data.available_jobs_manual;

    if (user) {
      data.submitter_name = user.name;
      data.submitter_ward = user.ward;
      data.submitter_stake = user.stake;
      data.submitter_phone = user.phone;
      data.submitter_email = user.email;
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
              <select name="company_type">
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
              <input type="url" name="career_website" />
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



            <div className="input-group">
              <label>Currently Hiring <span className="required">*</span></label>
              <select name="currently_hiring" required defaultValue="Yes">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="input-group full-width">
              <label>Available Jobs (Select multiple with Ctrl/Cmd, and/or enter manually)</label>
              <select name="available_jobs_select" multiple size="6">
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
              <input type="text" name="available_jobs_manual" placeholder="Other available jobs (comma separated)" style={{ marginTop: '0.5rem' }} />
            </div>

            <div className="input-group full-width">
              <label>Additional Notes</label>
              <textarea name="notes" rows="2"></textarea>
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
              {loading ? 'Submitting...' : 'Submit Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobEntry;
