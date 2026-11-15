function MatchingJobsTable({ jobs, emptyMessage }) {
  if (!jobs || jobs.length === 0) {
    return (
      <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
        {emptyMessage}
      </p>
    );
  }

  return (
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
          {jobs.map((job, idx) => (
            <tr key={idx}>
              <td>{job.company}</td>
              <td>{job.role}</td>
              <td>{job.location}</td>
              <td>{job.distance || 'N/A'}</td>
              <td>
                {job.career_website ? (
                  <a
                    href={job.career_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}
                  >
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
  );
}

function MatchingJobsSection({ selectedSeeker, matchingJobs, matchingJobsLoading }) {
  if (!selectedSeeker) return null;

  return (
    <div
      id="matching-jobs-section"
      className="matching-jobs-section mt-3"
      style={{ borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '2rem', marginTop: '2rem' }}
    >
      <h2 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
        Matching Jobs for {selectedSeeker.name}
      </h2>
      <p style={{ fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1.5rem' }}>
        Based on desired job types: <strong>{selectedSeeker.job_types || selectedSeeker.desired_job_types || 'N/A'}</strong>
      </p>
      {matchingJobsLoading ? (
        <p className="text-center">Loading matching jobs from JobBank...</p>
      ) : (
        <>
          <h3 style={{ marginTop: '1.5rem', color: '#2ecc71', borderBottom: '2px solid #2ecc71', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
            Currently Hiring Jobs ({matchingJobs.recent.length})
          </h3>
          <MatchingJobsTable
            jobs={matchingJobs.recent}
            emptyMessage="No currently hiring jobs found matching criteria."
          />

          <h3 style={{ marginTop: '2rem', color: '#f39c12', borderBottom: '2px solid #f39c12', paddingBottom: '0.4rem', marginBottom: '0.8rem' }}>
            Other Jobs Meeting Criteria (Not Currently Hiring) ({matchingJobs.older.length})
          </h3>
          <MatchingJobsTable
            jobs={matchingJobs.older}
            emptyMessage="No other matching jobs found."
          />
        </>
      )}
    </div>
  );
}

export default MatchingJobsSection;
