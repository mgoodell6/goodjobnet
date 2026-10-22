import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaBriefcase,
  FaUserTie,
  FaSearch,
  FaMapMarkedAlt,
  FaShieldAlt,
  FaPhone,
  FaMicrophone,
  FaCheckCircle,
  FaInfoCircle,
  FaSyncAlt,
  FaHandshake,
  FaGraduationCap,
  FaExternalLinkAlt,
  FaListUl,
  FaVolumeUp,
  FaUsers,
  FaClock,
  FaKeyboard,
  FaChartPie,
  FaClone
} from 'react-icons/fa';

function InformationAndHelp() {
  return (
    <div className="help-container fade-in">
      <div className="help-card help-card-wide">
        <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(58, 123, 213, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '10px'
          }}>
            <FaInfoCircle style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }} />
          </div>
          <h1 className="help-title">Information & Help</h1>
          <p className="help-subtitle">
            Comprehensive Guide to GoodJobNet Capabilities & Features
          </p>
        </header>

        {/* Quick Navigation Pills */}
        <nav className="help-pill-nav" aria-label="Help Sections Navigation">
          <a href="#about" className="help-pill"><FaHandshake /> About Job Bank</a>
          <a href="#job-search" className="help-pill"><FaSearch /> Search & Maps</a>
          <a href="#verification" className="help-pill"><FaCheckCircle /> Verification Queues</a>
          <a href="#voice-calling" className="help-pill"><FaMicrophone /> Voice & Calling HUD</a>
          <a href="#dashboards" className="help-pill"><FaChartPie /> Dashboards & Roster</a>
          <a href="#administration" className="help-pill"><FaShieldAlt /> System Admin</a>
          <a href="#services-contact" className="help-pill"><FaPhone /> Services & Contact</a>
        </nav>

        {/* Section 1: About the Job Bank */}
        <section id="about" className="help-section">
          <h2><FaHandshake style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> About the Job Bank & Philosophy</h2>
          <p>
            Job opportunities provided in GoodJobNet are primarily <strong>low-to-moderate wage and hourly entry-level positions</strong>. These listings are intentionally tailored for individuals who need <strong>immediate employment and income stability</strong>.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Securing higher-paying careers and long-term professional development typically requires time, resume refinement, networking, and targeted interview preparation. This is where the <strong>Orlando Employment Center coaches</strong> provide individualized guidance, mentoring job seekers toward lasting self-reliance while GoodJobNet bridges immediate financial needs.
          </p>
        </section>

        {/* Section 2: Search & Exploration */}
        <section id="job-search" className="help-section">
          <h2><FaSearch style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> Job Seeker Discovery & Mapping Tools</h2>
          <p>
            GoodJobNet provides spatial and criteria-based search tools to connect seekers with opportunities near their homes or public transportation routes:
          </p>

          <div className="help-grid">
            <div className="help-feature-card">
              <h3><FaMapMarkedAlt style={{ color: 'var(--primary-color)' }} /> Job Location Map</h3>
              <p>
                A visual, interactive GIS Google Map plotting the exact physical locations of verified, currently hiring job opportunities throughout Central Florida.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <a
                  href="https://www.google.com/maps/d/u/0/edit?mid=1YnckZ2k4jyCu6Agxg4VX0EyWK49puuo&ll=28.284392717060463%2C-82.04171770869505&z=9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-link"
                >
                  Open Live Job Map <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            </div>

            <div className="help-feature-card">
              <h3><FaSearch style={{ color: 'var(--primary-color)' }} /> Search for Nearby Jobs</h3>
              <p>
                Proximity-based search engine that calculates distances from any home address, city, or ZIP code within a selectable radius (5, 10, 15, or 20+ miles). Users can filter by industry categories (Retail, Warehouse, Food Service, Healthcare, IT, CDL, etc.) or free-text keywords.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/hot-job-search" className="help-link">Go to Nearby Job Search &rarr;</Link>
              </div>
            </div>

            <div className="help-feature-card">
              <h3><FaUserTie style={{ color: 'var(--primary-color)' }} /> Candidate Seeker Search</h3>
              <p>
                Reverse-proximity search allowing employment advisors and hiring partners to locate active job seekers residing near a given business address who desire specific job types.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/job-seeker-search" className="help-link">Go to Seeker Search &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Verification Queues */}
        <section id="verification" className="help-section">
          <h2><FaCheckCircle style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> Coach Job Verification Workflows</h2>
          <p>
            To keep the Job Bank reliable and fresh, employment advisors routinely verify employer hiring status. Validating a job as <strong>"Currently Hiring: Yes"</strong> automatically extends its expiration date by <strong>6 months</strong>. The review portal offers specialized queues to maximize outreach impact:
          </p>

          <div className="help-grid">
            <div className="help-feature-card">
              <h3>
                <span className="help-badge help-badge-purple">Advisor Priority</span>
                Verify Jobs for My Assigned Seekers
              </h3>
              <p>
                Curates opportunities matching the exact career interests of the logged-in coach's assigned job seekers.
              </p>
              <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', fontSize: '0.88rem', color: 'var(--text-light)' }}>
                <li><strong>My Assigned Seekers:</strong> Shows how many of your assigned candidates are interested in this job.</li>
                <li><strong>Total Seekers:</strong> Displays overall demand across the entire Employment Center.</li>
                <li><strong>Interactive Modal:</strong> Click <em>"View Assigned Seekers"</em> to view candidate names, contact phone numbers, and commute distances.</li>
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/hot-jobs-review?category=my_assigned_seekers" className="help-link">Open My Seekers Queue &rarr;</Link>
              </div>
            </div>

            <div className="help-feature-card">
              <h3>
                <span className="help-badge help-badge-warning">Outreach Queue</span>
                Phone Verification Queue
              </h3>
              <p>
                Filters for companies that have not been verified in over 3 months and do <em>not</em> maintain an online career website—requiring telephone verification.
              </p>
              <p style={{ marginTop: '0.3rem', fontSize: '0.88rem' }}>
                <strong>Sorted by Demand:</strong> Automatically sorted descending by number of interested job seekers so coaches phone employers with the highest candidate demand first.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/hot-jobs-review?category=unverified_no_career" className="help-link">Open Phone Verification Queue &rarr;</Link>
              </div>
            </div>

            <div className="help-feature-card">
              <h3>
                <span className="help-badge help-badge-primary">Center Demand</span>
                Verify Jobs for JobSeekers
              </h3>
              <p>
                Presents all opportunities with active seeker demand across the entire Orlando Employment Center, sorted so coaches focus on positions candidates are currently seeking.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/hot-jobs-review?category=jobseekers" className="help-link">Open JobSeekers Queue &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Voice Assistant HUD & Calling */}
        <section id="voice-calling" className="help-section">
          <h2><FaMicrophone style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> Voice Assistant HUD & Automated Calling</h2>
          <p>
            The Hot Jobs Review screen includes an integrated <strong>Voice Assistant Heads-Up Display (HUD)</strong> designed for hands-free operation while coaches make phone calls:
          </p>

          <table className="help-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Action / Shortcut</th>
                <th style={{ width: '32%' }}>Voice Command</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>Spacebar</kbd> / Click Phone</td>
                <td><em>"Call Company"</em></td>
                <td>Dials the employer phone number via Google Voice or Windows Phone Link.</td>
              </tr>
              <tr>
                <td>Right Arrow / Next Button</td>
                <td><em>"Next"</em></td>
                <td>Advances to the next job in the review queue.</td>
              </tr>
              <tr>
                <td>Left Arrow / Previous Button</td>
                <td><em>"Previous"</em></td>
                <td>Navigates back to the preceding job record.</td>
              </tr>
              <tr>
                <td>Audio Button</td>
                <td><em>"Read Job"</em></td>
                <td>Text-to-speech engine speaks the company name, position, address, and notes.</td>
              </tr>
              <tr>
                <td>Currently Hiring Toggle</td>
                <td><em>"Currently Hiring"</em> / <em>"Not Hiring"</em></td>
                <td>Sets the hiring status flag without clicking.</td>
              </tr>
              <tr>
                <td>Save Button</td>
                <td><em>"Save"</em></td>
                <td>Saves all record updates and advances to the next opportunity.</td>
              </tr>
              <tr>
                <td>Notes Dictation</td>
                <td><em>"Start Notes"</em> ... <em>"Stop Notes"</em></td>
                <td>Dictates notes directly into the employer's record hands-free.</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '1rem', background: 'rgba(58, 123, 213, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(58, 123, 213, 0.15)' }}>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              <strong><FaPhone style={{ marginRight: '6px' }} /> Desktop Phone Integration:</strong> GoodJobNet connects to a lightweight local background helper (<code>local_helper.py</code>) enabling direct integration with <strong>Google Voice</strong> web dialer or the <strong>Windows Phone Link</strong> app on the coach's workstation.
            </p>
          </div>
        </section>

        {/* Section 5: Dashboards & Seeker Management */}
        <section id="dashboards" className="help-section">
          <h2><FaChartPie style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> Employment Center Dashboards & Coaching</h2>
          <p>
            GoodJobNet provides comprehensive real-time dashboards for advisors and administrators to track center performance, candidate readiness, and job market supply and demand:
          </p>

          <div className="help-grid">
            <div className="help-feature-card">
              <h3><FaChartPie style={{ color: 'var(--primary-color)' }} /> Employment Center Dashboard</h3>
              <p>
                Centralized command center featuring synchronized pie charts comparing <strong>Hot Jobs by Industry</strong> against <strong>Job Seekers by Desired Type</strong> using consistent color coordination to reveal supply and demand balance. Includes real-time <em>Attention Needed</em> alert counters.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/employment-dashboard" className="help-link">Go to Center Dashboard &rarr;</Link>
              </div>
            </div>

            <div className="help-feature-card">
              <h3><FaUsers style={{ color: 'var(--primary-color)' }} /> Assigned Job Seekers List</h3>
              <p>
                Roster of all job seekers assigned to the logged-in coach. Displays contact numbers, email addresses, preferred job types, notes, and visual readiness badges for <strong>Resume Assistance</strong>, <strong>Interview Preparation</strong>, and <strong>Job Search Coaching</strong>.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/assigned-job-seekers" className="help-link">View Assigned Seekers Roster &rarr;</Link>
              </div>
            </div>

            <div className="help-feature-card">
              <h3><FaBriefcase style={{ color: 'var(--primary-color)' }} /> Job Opportunity Entry</h3>
              <p>
                Standardized intake form allowing coaches, volunteers, and patrons to submit newly discovered job openings directly into the Google Sheets JobBank for verification and community distribution.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <Link to="/job-entry" className="help-link">Open Job Entry Form &rarr;</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: System Administration */}
        <section id="administration" className="help-section">
          <h2><FaShieldAlt style={{ color: 'var(--primary-color)', marginRight: '8px' }} /> System Administration Portal</h2>
          <p>
            Administrators have access to back-office synchronization, cloud backup, and automated job ingestion utilities via the <Link to="/admin-page" className="help-link" style={{ display: 'inline', margin: 0 }}>System Administration Portal</Link>:
          </p>

          <div className="help-grid">
            <div className="help-feature-card">
              <h3><FaSyncAlt style={{ color: 'var(--primary-color)' }} /> Sync JobSeeker Match Counts</h3>
              <p>
                High-throughput batch utility that cross-references candidate job preferences against all entries in both the <strong>JobBank</strong> (2,200+ rows) and the <strong>Phone Verification List</strong> (700+ rows), updating accurate seeker counts across both databases.
              </p>
            </div>

            <div className="help-feature-card">
              <h3><FaMapMarkedAlt style={{ color: 'var(--primary-color)' }} /> Update HotJobsMapFile</h3>
              <p>
                Exports all opportunities from the JobBank that have been verified within the last 3 weeks with <code>Currently Hiring = TRUE</code> directly to Google Spreadsheet <code>1IlSEHWOyN7fr0osR4IMEyhc-UvxGCI7bUtbTbCRUBlY</code> to power the live GIS map layer.
              </p>
            </div>

            <div className="help-feature-card">
              <h3><FaBriefcase style={{ color: 'var(--primary-color)' }} /> JSearch Job Ingestion</h3>
              <p>
                Automated fetch routine querying the RapidAPI JSearch service for featured corporate employers (Walmart, Amazon, Publix, Target, Home Depot, etc.) across the Orlando metro area, appending fresh opportunities to the intake queue.
              </p>
            </div>

            <div className="help-feature-card">
              <h3><FaClone style={{ color: 'var(--primary-color)' }} /> Detect JobBank Address Duplicates</h3>
              <p>
                Scans all entries in the <strong>JobBank</strong> spreadsheet, normalizing street addresses and cities to identify potential duplicates. Writes the total count of matching entries into the <code>Potential Duplicate</code> column (or <code>0</code> for unique entries).
              </p>
            </div>
          </div>


          <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', color: 'var(--text-dark)' }}>Contact Information</h3>
          <p>For questions regarding coaching, employment assistance, or website administration:</p>
          <ul className="contact-list">
            <li>
              <strong>Orlando Employment Center:</strong>{' '}
              <a href="tel:407-826-9375">407-826-9375</a>
            </li>
            <li>
              <strong>Center Email:</strong>{' '}
              <a href="mailto:Orlandoemploymentoffice@gmail.com">Orlandoemploymentoffice@gmail.com</a>
            </li>
            <li>
              <strong>Website Administrator:</strong>{' '}
              <a href="mailto:mgoodell6@gmail.com">mgoodell6@gmail.com</a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default InformationAndHelp;
