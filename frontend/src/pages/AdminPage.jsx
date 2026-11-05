import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaShieldAlt, FaUser, FaBriefcase, FaUserTie, FaSync, FaCloudDownloadAlt, FaExternalLinkAlt, FaMapMarkedAlt, FaClone } from 'react-icons/fa';

function AdminPage({ user }) {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    new_jobs_url: '#',
    new_seekers_url: '#'
  });

  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [syncingCsv, setSyncingCsv] = useState(false);
  const [syncCsvStatus, setSyncCsvStatus] = useState(null);
  const [updatingMap, setUpdatingMap] = useState(false);
  const [mapStatus, setMapStatus] = useState(null);
  const [detectingDups, setDetectingDups] = useState(false);
  const [dupStatus, setDupStatus] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats({
            new_jobs_url: data.new_jobs_url || '#',
            new_seekers_url: data.new_seekers_url || '#'
          });
        }
      })
      .catch(err => {
        console.error('Error fetching dashboard stats for admin page:', err);
      });
  }, []);

  const handleUpdateJobSeekerInfo = () => {
    setUpdating(true);
    setUpdateStatus(null);
    setExportStatus(null);
    setSyncCsvStatus(null);
    setMapStatus(null);
    setDupStatus(null);
    fetch('/api/update-jobseeker-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setUpdating(false);
        if (data.success) {
          setUpdateStatus({ success: true, message: data.message });
        } else {
          setUpdateStatus({ success: false, message: data.error || 'Failed to update.' });
        }
      })
      .catch(err => {
        setUpdating(false);
        setUpdateStatus({ success: false, message: 'Network error occurred.' });
        console.error('Error updating jobseeker info:', err);
      });
  };

  const handleExportJSearchJobs = () => {
    setExporting(true);
    setExportStatus(null);
    setUpdateStatus(null);
    setSyncCsvStatus(null);
    setMapStatus(null);
    setDupStatus(null);
    fetch('/api/export-jsearch-jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setExporting(false);
        if (data.success) {
          setExportStatus({
            success: true,
            message: data.message,
            warning: data.warning,
            jsearch_limit_exceeded: data.jsearch_limit_exceeded,
            url: data.url,
            count: data.count
          });
        } else {
          setExportStatus({
            success: false,
            message: (data.error || 'Failed to export JSearch jobs.') + (data.details ? ` (${data.details})` : ''),
            warning: data.warning,
            jsearch_limit_exceeded: data.jsearch_limit_exceeded,
            url: data.url
          });
        }
      })
      .catch(err => {
        setExporting(false);
        setExportStatus({ success: false, message: 'Network error occurred exporting jobs.' });
        console.error('Error exporting JSearch jobs:', err);
      });
  };

  const handleSyncJobSeekersCsv = () => {
    setSyncingCsv(true);
    setSyncCsvStatus(null);
    setUpdateStatus(null);
    setExportStatus(null);
    setMapStatus(null);
    setDupStatus(null);

    fetch('/api/sync-jobseekers-csv-to-drive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setSyncingCsv(false);
        if (data.success) {
          setSyncCsvStatus({ success: true, message: data.message, url: data.url });
        } else {
          setSyncCsvStatus({ success: false, message: data.error || 'Failed to sync JobSeeker CSV.' });
        }
      })
      .catch(err => {
        setSyncingCsv(false);
        setSyncCsvStatus({ success: false, message: 'Network error occurred while syncing JobSeeker CSV.' });
        console.error('Error syncing JobSeeker CSV:', err);
      });
  };

  const handleUpdateHotJobsMap = () => {
    setUpdatingMap(true);
    setMapStatus(null);
    setUpdateStatus(null);
    setExportStatus(null);
    setSyncCsvStatus(null);
    setDupStatus(null);

    fetch('/api/update-hot-jobs-map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setUpdatingMap(false);
        if (data.success) {
          setMapStatus({
            success: true,
            message: data.message,
            url: data.url,
            count: data.count
          });
        } else {
          setMapStatus({
            success: false,
            message: (data.error || 'Failed to update HotJobsMapFile.') + (data.details ? ` (${data.details})` : ''),
            url: data.url
          });
        }
      })
      .catch(err => {
        setUpdatingMap(false);
        setMapStatus({ success: false, message: 'Network error occurred while updating HotJobsMapFile.' });
        console.error('Error updating HotJobsMapFile:', err);
      });
  };

  const handleDetectJobBankDuplicates = () => {
    setDetectingDups(true);
    setDupStatus(null);
    setUpdateStatus(null);
    setExportStatus(null);
    setSyncCsvStatus(null);
    setMapStatus(null);

    fetch('/api/detect-jobbank-duplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setDetectingDups(false);
        if (data.success) {
          setDupStatus({
            success: true,
            message: data.message,
            url: data.url
          });
        } else {
          setDupStatus({
            success: false,
            message: (data.error || 'Failed to detect duplicates in JobBank.') + (data.details ? ` (${data.details})` : ''),
            url: data.url
          });
        }
      })
      .catch(err => {
        setDetectingDups(false);
        setDupStatus({ success: false, message: 'Network error occurred while detecting duplicates.' });
        console.error('Error detecting duplicates:', err);
      });
  };

  return (
    <div className="app-container fade-in">
      <div className="glass-panel main-form" style={{ maxWidth: '900px' }}>
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(58, 123, 213, 0.1)', padding: '12px', borderRadius: '50%', marginBottom: '10px' }}>
            <FaShieldAlt style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }} />
          </div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>System Administration</h1>
          <p className="subtitle">GoodJobNet Admin Portal</p>
        </header>

        {/* User Session Info Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.6)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUser style={{ color: 'var(--primary-color)' }} /> Active Session Info
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Account Name</strong>
              <p style={{ fontWeight: '600' }}>{user?.name || 'N/A'}</p>
            </div>
            <div>
              <strong style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>System Role</strong>
              <p style={{ fontWeight: '600', color: user?.role === 'admin' ? '#27ae60' : 'var(--text-dark)' }}>
                {user?.role === 'admin' ? 'Administrator' : user?.role || 'Standard User'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Tools Navigation Grid (Icons) */}
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>Admin Tools & Actions</h2>
        <div className="nav-grid mb-2">
          {/* Card 1: Review New Job Opportunities */}
          <a
            href={stats.new_jobs_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-card"
            style={{ opacity: stats.new_jobs_url && stats.new_jobs_url !== '#' ? 1 : 0.6 }}
          >
            <FaBriefcase />
            <h3>Review New Job Opportunities</h3>
          </a>

          {/* Card 2: Review New Job Seekers */}
          {stats.new_seekers_url && stats.new_seekers_url !== '#' ? (
            <a
              href={stats.new_seekers_url}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-card"
            >
              <FaUserTie />
              <h3>Review New Job Seekers</h3>
            </a>
          ) : (
            <div className="nav-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <FaUserTie />
              <h3>Review New Job Seekers</h3>
            </div>
          )}

          {/* Card 3: Update jobBank jobSeeker information */}
          <button
            type="button"
            onClick={handleUpdateJobSeekerInfo}
            disabled={updating}
            className="nav-card"
            style={{ opacity: updating ? 0.7 : 1 }}
          >
            <FaSync className={updating ? 'spin' : ''} />
            <h3>{updating ? 'Updating jobSeeker info...' : 'Update JobBank & Phone Verification jobSeeker information'}</h3>
          </button>

          {/* Card 4: Export Jobs from JSearch */}
          <button
            type="button"
            onClick={handleExportJSearchJobs}
            disabled={exporting}
            className="nav-card"
            style={{ opacity: exporting ? 0.7 : 1 }}
          >
            <FaCloudDownloadAlt className={exporting ? 'spin' : ''} />
            <h3>{exporting ? 'Exporting Jobs (JSearch & Companies)...' : 'Export Jobs (JSearch & Featured Companies)'}</h3>
          </button>

          {/* Card 5: Sync JobSeeker CSV to Google Drive */}
          <button
            type="button"
            onClick={handleSyncJobSeekersCsv}
            disabled={syncingCsv}
            className="nav-card"
            style={{ opacity: syncingCsv ? 0.7 : 1 }}
          >
            <FaSync className={syncingCsv ? 'spin' : ''} />
            <h3>{syncingCsv ? 'Syncing JobSeeker CSV to Drive...' : 'Sync JobSeeker CSV to Google Drive'}</h3>
          </button>

          {/* Card 6: Update HotJobsMapFile */}
          <button
            type="button"
            onClick={handleUpdateHotJobsMap}
            disabled={updatingMap}
            className="nav-card"
            style={{ opacity: updatingMap ? 0.7 : 1 }}
          >
            <FaMapMarkedAlt className={updatingMap ? 'spin' : ''} />
            <h3>{updatingMap ? 'Updating HotJobsMapFile...' : 'Update HotJobsMapFile'}</h3>
          </button>

          {/* Card 7: Detect JobBank Address Duplicates */}
          <button
            type="button"
            onClick={handleDetectJobBankDuplicates}
            disabled={detectingDups}
            className="nav-card"
            style={{ opacity: detectingDups ? 0.7 : 1 }}
          >
            <FaClone className={detectingDups ? 'spin' : ''} />
            <h3>{detectingDups ? 'Scanning JobBank for duplicates...' : 'Detect JobBank Address Duplicates'}</h3>
          </button>
        </div>

        {/* Operation Status Feedback */}
        {(updateStatus || exportStatus || syncCsvStatus || mapStatus || dupStatus) && (
          <div style={{ marginTop: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: (updateStatus?.success || syncCsvStatus?.success || mapStatus?.success || dupStatus?.success || (exportStatus?.success && !exportStatus?.jsearch_limit_exceeded)) ? 'var(--success)' : 'var(--error)',
              margin: 0
            }}>
              {updateStatus ? updateStatus.message : exportStatus ? exportStatus.message : syncCsvStatus ? syncCsvStatus.message : mapStatus ? mapStatus.message : dupStatus.message}
            </p>
            {exportStatus?.warning && (
              <p style={{ fontSize: '0.9rem', color: '#e67e22', fontWeight: 600, marginTop: '0.5rem' }}>
                ⚠️ {exportStatus.warning}
              </p>
            )}
            {exportStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={exportStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open Job Postings Sheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
            {syncCsvStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={syncCsvStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open JobSeeker List Google Drive Sheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
            {mapStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={mapStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open HotJobsMapFile Spreadsheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
            {dupStatus?.url && (
              <div style={{ marginTop: '0.75rem' }}>
                <a
                  href={dupStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: 'auto',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.85rem',
                    background: 'rgba(255,255,255,0.8)',
                    borderColor: 'var(--primary-color)',
                    color: 'var(--primary-color)'
                  }}
                >
                  Open JobBank Spreadsheet <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="actions mt-2 text-center" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn secondary-btn"
            style={{ maxWidth: '350px' }}
            onClick={() => navigate('/employment-dashboard')}
          >
            Back to Employment Center Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
