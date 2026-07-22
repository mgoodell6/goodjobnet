import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Row, Col, Stack, Button, Badge, Alert, Table } from 'react-bootstrap';
import MultiSelect from '../components/MultiSelect';

const JOB_OPTIONS = [
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

function JobSeekerSearch({ user }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [savedInputs, setSavedInputs] = useState(() => {
    const saved = sessionStorage.getItem('seeker_search_inputs');
    return saved ? JSON.parse(saved) : { name: '', job_types: [], address: '', radius: '20', other_job_type: '' };
  });

  const [results, setResults] = useState(null);
  const [selectedJobTypes, setSelectedJobTypes] = useState(savedInputs.job_types || []);

  const [selectedSeeker, setSelectedSeeker] = useState(null);
  const [matchingJobs, setMatchingJobs] = useState({ recent: [], older: [] });
  const [matchingJobsLoading, setMatchingJobsLoading] = useState(false);

  const loadMatchingJobs = useCallback(async (seeker) => {
    setSelectedSeeker(seeker);
    setMatchingJobsLoading(true);
    try {
      const response = await fetch(`/api/seeker-matching-jobs?row_index=${seeker.row_index}&job_types=${encodeURIComponent(seeker.job_types || seeker.desired_job_types || '')}&zipcode=${encodeURIComponent(seeker.zipcode || '')}`);
      const data = await response.json();
      if (data.success) {
        setMatchingJobs(data.results);
      } else {
        alert("Failed to load matching jobs: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (results) {
        const nearbyList = results.nearby || [];
        const otherList = results.other || [];
        const totalCount = nearbyList.length + otherList.length;
        if (totalCount === 1) {
          const singleSeeker = nearbyList.length === 1 ? nearbyList[0] : otherList[0];
          loadMatchingJobs(singleSeeker);
        } else {
          setSelectedSeeker(null);
          setMatchingJobs({ recent: [], older: [] });
        }
      } else {
        setSelectedSeeker(null);
        setMatchingJobs({ recent: [], older: [] });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [results, loadMatchingJobs]);

  const performSearch = useCallback(async (searchParams) => {
    setLoading(true);
    
    // Store inputs in state & session storage
    const inputs = {
      name: searchParams.name || '',
      job_types: searchParams.job_types || [],
      address: searchParams.address || '',
      radius: searchParams.radius || '20',
      other_job_type: searchParams.other_job_type || ''
    };
    setSavedInputs(inputs);
    setSelectedJobTypes(inputs.job_types);
    sessionStorage.setItem('seeker_search_inputs', JSON.stringify(inputs));

    const combinedJobTypes = [...inputs.job_types];
    if (inputs.other_job_type && inputs.other_job_type.trim() !== '') {
      const extraTypes = inputs.other_job_type.split(',').map(s => s.trim()).filter(Boolean);
      combinedJobTypes.push(...extraTypes);
    }

    const data = {
      name: inputs.name,
      job_types: combinedJobTypes,
      address: inputs.address,
      radius: inputs.radius
    };

    try {
      const response = await fetch('/api/search-seekers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();

      if (resultData.success) {
        setResults(resultData.results);
        sessionStorage.setItem('seeker_search_results', JSON.stringify(resultData.results));
      } else {
        alert('Search failed: ' + (resultData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location.state?.autoSearch) {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');

      const allJobTypes = location.state.jobTypes || [];
      const matched = allJobTypes.filter(j => JOB_OPTIONS.includes(j));
      const unmatched = allJobTypes.filter(j => !JOB_OPTIONS.includes(j));

      const searchParams = {
        name: '',
        job_types: matched,
        address: location.state.address || '',
        radius: '20',
        other_job_type: unmatched.join(', ')
      };

      setTimeout(() => {
        performSearch(searchParams);
      }, 0);
    } else if (location.state?.keepResults) {
      const savedRes = sessionStorage.getItem('seeker_search_results');
      const savedInp = sessionStorage.getItem('seeker_search_inputs');
      setTimeout(() => {
        if (savedRes) {
          setResults(JSON.parse(savedRes));
        }
        if (savedInp) {
          const parsedInp = JSON.parse(savedInp);
          setSavedInputs(parsedInp);
          setSelectedJobTypes(parsedInp.job_types || []);
        }
      }, 0);
    } else {
      sessionStorage.removeItem('seeker_search_results');
      sessionStorage.removeItem('seeker_search_inputs');
      setTimeout(() => {
        setSavedInputs({ name: '', job_types: [], address: '', radius: '20', other_job_type: '' });
        setSelectedJobTypes([]);
        setResults(null);
      }, 0);
    }
  }, [location.state, performSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const jobTypes = formData.getAll('job_type');
    const otherJobType = formData.get('other_job_type') || '';
    const name = formData.get('name') || '';
    const address = formData.get('address') || '';
    const radius = formData.get('radius') || '20';

    await performSearch({
      name,
      job_types: jobTypes,
      address,
      radius,
      other_job_type: otherJobType
    });
  };

  return (
    <main className="app-container search-page">
      <Card className={`glass-panel main-form border-0 shadow-sm search-shell${results ? ' has-results' : ''}`}>
        <div className="search-hero">
          <div><div className="portal-eyebrow">Employment Center search</div><h1 className="mb-2">Find job seekers</h1><p className="subtitle">Find unemployed individuals by name, job type, and distance from an address.</p></div>
          <div className="search-hero-icon"><i className="bi bi-people" aria-hidden="true" /></div>
        </div>

        <Form onSubmit={handleSearch}>
          <Form.Group className="search-primary-field mb-4" controlId="seeker-name">
            <Form.Label>Search by Name <span className="fw-normal text-muted">(optional - bypasses job types and location)</span></Form.Label>
            <Form.Control type="text" name="name" placeholder="Enter seeker name..." defaultValue={savedInputs.name || ''} />
            <Form.Text>OR, search by job type(s) and radius from given location</Form.Text>
          </Form.Group>

          <Row className="g-4">
            <Col lg={5}>
              <Form.Group controlId="job-type">
                <Form.Label>Job types</Form.Label>
                <MultiSelect name="job_type" options={JOB_OPTIONS} value={selectedJobTypes} onChange={setSelectedJobTypes} size={4} />
                <Form.Text>Click roles to select or clear them.</Form.Text>
              </Form.Group>
            </Col>
            <Col lg={7}>
              <Form.Group controlId="address" className="mb-3">
                <Form.Label>Find individuals near this location</Form.Label>
                <Form.Control as="textarea" name="address" rows={3} placeholder="Street, city, or ZIP code (e.g. 32801)" defaultValue={savedInputs.address} />
              </Form.Group>
              <Row className="g-3">
                <Col sm={8}>
                  <Form.Group controlId="other-job-type">
                    <Form.Label>Other job type <span className="fw-normal text-muted">(optional)</span></Form.Label>
                    <Form.Control type="text" name="other_job_type" placeholder="Add a job type not listed" defaultValue={savedInputs.other_job_type} />
                  </Form.Group>
                </Col>
                <Col sm={4}>
                  <Form.Group controlId="radius">
                    <Form.Label>Radius <span className="fw-normal text-muted">(miles)</span></Form.Label>
                    <Form.Control type="number" name="radius" defaultValue={savedInputs.radius || '20'} min="1" />
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>

          <Stack direction="horizontal" gap={2} className="justify-content-end mt-4 search-actions">
            <Button type="button" variant="outline-secondary" onClick={() => navigate(user?.role === 'admin' ? '/admin-dashboard' : '/dashboard')}>Back</Button>
            <Button type="submit" className="primary-btn px-4" disabled={loading}>
              <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-search'} me-2`} aria-hidden="true" />
              {loading ? 'Searching...' : 'Find job seekers'}
            </Button>
          </Stack>
        </Form>

        {results && (
          <section className="search-results" aria-label="Search results" tabIndex="-1">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <div className="portal-eyebrow">Results</div>
                <h2 className="h3 mb-0">Job Seekers Found</h2>
              </div>
              <Badge bg="success" pill>{(results.nearby?.length || 0) + (results.other?.length || 0)} matches</Badge>
            </div>

            <Card className="result-group border-0 mb-4">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h3 className="h5 mb-1 text-success">Within Radius</h3>
                <p className="small mb-0">Job seekers near your specified location.</p>
              </Card.Header>
              <Card.Body className="pt-1">
                {results.nearby?.length ? (
                  <div className="table-container">
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Job Types</th>
                          <th>Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.nearby.map((seeker, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              <Link to="/job-seeker-entry" state={{ seeker, fromSearch: true }} style={{ textDecoration: 'none' }}>
                                {seeker.name}
                              </Link>
                            </td>
                            <td>{seeker.address || 'N/A'}</td>
                            <td>{seeker.phone ? <a href={`tel:${seeker.phone}`}>{seeker.phone}</a> : 'N/A'}</td>
                            <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                            <td>{seeker.job_types}</td>
                            <td>{typeof seeker.distance === 'number' ? `${seeker.distance} mile${seeker.distance === 1 ? '' : 's'}` : seeker.distance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="light" className="mb-0">No job seekers found within the radius.</Alert>
                )}
              </Card.Body>
            </Card>

            <Card className="result-group border-0">
              <Card.Header className="bg-transparent border-0 pt-3">
                <h3 className="h5 mb-1 text-warning-emphasis">Other Matches</h3>
                <p className="small mb-0">Job seekers outside the radius or with no location provided.</p>
              </Card.Header>
              <Card.Body className="pt-1">
                {results.other?.length ? (
                  <div className="table-container">
                    <Table responsive hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Job Types</th>
                          <th>Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.other.map((seeker, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              <Link to="/job-seeker-entry" state={{ seeker, fromSearch: true }} style={{ textDecoration: 'none' }}>
                                {seeker.name}
                              </Link>
                            </td>
                            <td>{seeker.address || 'N/A'}</td>
                            <td>{seeker.phone ? <a href={`tel:${seeker.phone}`}>{seeker.phone}</a> : 'N/A'}</td>
                            <td>{seeker.email ? <a href={`mailto:${seeker.email}`}>{seeker.email}</a> : 'N/A'}</td>
                            <td>{seeker.job_types}</td>
                            <td>{typeof seeker.distance === 'number' ? `${seeker.distance} mile${seeker.distance === 1 ? '' : 's'}` : seeker.distance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <Alert variant="light" className="mb-0">No other matching job seekers found.</Alert>
                )}
              </Card.Body>
            </Card>

            {selectedSeeker && matchingJobs && (
              <Card className="result-group border-0 mt-4">
                <Card.Header className="bg-transparent border-0 pt-3">
                  <h3 className="h5 mb-1">Matching Jobs for {selectedSeeker.name}</h3>
                  <p className="small mb-0">Based on desired job types: <strong>{selectedSeeker.job_types || selectedSeeker.desired_job_types}</strong></p>
                </Card.Header>
                <Card.Body className="pt-1">
                  {matchingJobsLoading ? (
                    <p className="text-center">Loading matching jobs...</p>
                  ) : (
                    <>
                      <Card className="result-group border-0 mb-3">
                        <Card.Header className="bg-transparent border-0 pt-2 pb-2">
                          <h4 className="h6 mb-0 text-success">Currently Hiring ({matchingJobs.recent?.length || 0})</h4>
                        </Card.Header>
                        <Card.Body className="pt-1 pb-2">
                          {matchingJobs.recent?.length ? (
                            <div className="table-container">
                              <Table responsive hover className="mb-0 align-middle">
                                <thead>
                                  <tr>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Location</th>
                                    <th>Distance</th>
                                    <th>Posting</th>
                                    <th>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchingJobs.recent.map((job, idx) => (
                                    <tr key={idx}>
                                      <td className="fw-semibold">{job.company}</td>
                                      <td>{job.role}</td>
                                      <td>{job.location}</td>
                                      <td>{job.distance || 'N/A'}</td>
                                      <td>{job.career_website ? <a href={job.career_website} target="_blank" rel="noopener noreferrer">View posting</a> : 'N/A'}</td>
                                      <td>{job.notes || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <Alert variant="light" className="mb-0">No currently hiring jobs found.</Alert>
                          )}
                        </Card.Body>
                      </Card>

                      <Card className="result-group border-0">
                        <Card.Header className="bg-transparent border-0 pt-2 pb-2">
                          <h4 className="h6 mb-0 text-warning-emphasis">Other Matching Jobs ({matchingJobs.older?.length || 0})</h4>
                        </Card.Header>
                        <Card.Body className="pt-1">
                          {matchingJobs.older?.length ? (
                            <div className="table-container">
                              <Table responsive hover className="mb-0 align-middle">
                                <thead>
                                  <tr>
                                    <th>Company</th>
                                    <th>Role</th>
                                    <th>Location</th>
                                    <th>Distance</th>
                                    <th>Posting</th>
                                    <th>Notes</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {matchingJobs.older.map((job, idx) => (
                                    <tr key={idx}>
                                      <td className="fw-semibold">{job.company}</td>
                                      <td>{job.role}</td>
                                      <td>{job.location}</td>
                                      <td>{job.distance || 'N/A'}</td>
                                      <td>{job.career_website ? <a href={job.career_website} target="_blank" rel="noopener noreferrer">View posting</a> : 'N/A'}</td>
                                      <td>{job.notes || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ) : (
                            <Alert variant="light" className="mb-0">No other matching jobs found.</Alert>
                          )}
                        </Card.Body>
                      </Card>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}
          </section>
        )}
      </Card>
    </main>
  );
}

export default JobSeekerSearch;
