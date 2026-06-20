import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const seekerTypes = seeker?.desired_job_types ? seeker.desired_job_types.split(',').map(t => t.trim()) : [];
  const standardSelected = seekerTypes.filter(t => standardOptions.includes(t));
  const customSelected = seekerTypes.filter(t => !standardOptions.includes(t)).join(', ');

  const [selectedJobTypes, setSelectedJobTypes] = useState(standardSelected);

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
              <input type="text" name="name" defaultValue={seeker?.name || ''} required />
            </div>

            <div className="input-group full-width">
              <label>Street Address</label>
              <input type="text" name="street" defaultValue={seeker?.street || ''} />
            </div>

            <div className="input-group">
              <label>City <span className="required">*</span></label>
              <input type="text" name="city" defaultValue={seeker?.city || ''} required />
            </div>

            <div className="input-group">
              <label>Zipcode <span className="required">*</span></label>
              <input type="text" name="zipcode" defaultValue={seeker?.zipcode || ''} required />
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
              <label>Desired Job type(s) (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                name="desired_job_types" 
                multiple 
                size="4" 
                value={selectedJobTypes} 
                onChange={e => setSelectedJobTypes(Array.from(e.target.selectedOptions, option => option.value))}
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
                if (seeker) {
                  navigate('/job-seeker-search');
                } else {
                  navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard');
                }
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn primary-btn" 
              disabled={loading || !!seeker}
            >
              {loading ? 'Submitting...' : 'Submit Job Seeker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobSeekerEntry;
