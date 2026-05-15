import React from 'react';

function InformationAndHelp() {
  return (
    <div className="help-container fade-in">
      <div className="help-card">
        <h1 className="help-title">Information & Help</h1>

        <div className="help-section">
          <h2>About the Job Bank</h2>
          <p>
            Jobs opportunities provided on this website are primarily <strong>low or minimum wage</strong>. These jobs are tailored for individuals that need <strong>immediate employment</strong>. Higher paying jobs and establishing a stable career typically takes time and is an area where our Employment Center coaches can provide assistance.
          </p>
        </div>

        <div className="help-section">
          <h2>User Options</h2>
          <ul>
            <li>Job Location Map: This is a map showing the locations of the jobs that are posted in the Screened Job Opportunities list.</li>
            <li>Search for nearby jobs: This is a search engine for jobs that are within a certain radius of an address that is provided by the user.</li>
            <li>Job Seeker Entry: This is a form for entering general information for individuals that are seeking employment. This information is then reviewed by the Orlando Employment Center so they can provide assistance.</li>
            <li>Job Opportunity Entry: This is a form for entering employment opportunities that can be be made available through the Orlando Employment Center for others who are seeking employment.</li>
          </ul>
        </div>

        <div className="help-section">
          <h2>Employment Seeker Assistance</h2>
          <p>
            The Employment Center will review all <strong>Employment Seeker entries</strong> and will attempt to reach out and assist as much as possible. We are dedicated to supporting you as you help others find success their journey to employment.
          </p>
        </div>

        <div className="help-section">
          <h2>Orlando Employment Center Services</h2>
          <p>
            Information regarding services provided at the Orlando Employment Center can be found at our official page:
            <br />
            <a
              href="https://www.churchofjesuschrist.org/life/employment-centers?lang=eng"
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
            >
              Church of Jesus Christ - Employment Centers
            </a>
          </p>
        </div>

        <div className="help-section contact-section">
          <h2>Contact Us</h2>
          <p>Questions or comments regarding this website can be directed to:</p>
          <ul className="contact-list">
            <li>
              <strong>Email:</strong> <a href="mailto:mgoodell6@gmail.com">mgoodell6@gmail.com</a>
            </li>
            <li>
              <strong>Orlando Employment Center:</strong> <a href="tel:407-826-9375">407-826-9375</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default InformationAndHelp;
