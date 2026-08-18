import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Card, Col, Form, Row, Stack, Table } from 'react-bootstrap';
import MultiSelect from '../components/MultiSelect';

const JOB_OPTIONS = [
  'HVAC Repair', 'Accountant', 'Airport (Baggage/customer service/ground ops)', 'Auto Parts', 'Car Wash Attendant',
  'Cashier', 'Catering', 'CDL Driver', 'Cement Mason/finisher', 'Computer / IT', 'Computer Programmer', 'Construction',
  'Corrections', 'Custodian', 'Customer service', 'Data Entry', 'Day Care / Preschool', 'Delivery Driver', 'Drywaller',
  'Educator', 'Electrician', 'Engineering', 'Event Staff', 'Fast food', 'Gas Station Attendant', 'Grocery Store',
  'Healthcare', 'Hotel/Hospitality', 'Housekeeper', 'Information Technology (IT)', 'Landscaping', 'Manager (Department/Project)',
  'Manager (Store/Crew)', 'Mechanic', 'Manufacturing', 'Nursing', 'Painter', 'Pest Control', 'Plumbing',
  'Restaurant (Cook/Waiter/Host)', 'Retail', 'Sales', 'Security', 'Stocking', 'Telephone/Call Center/Scheduling',
  'Theme Park', 'Trucking/Transportation', 'Warehousing/Logistics'
];

function JobResults({ results, resultsRef }) {
  const renderTable = (jobs) => (
    <div className="table-container">
      <Table responsive hover className="mb-0 align-middle">
        <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Distance</th><th>Posting</th><th>Notes</th></tr></thead>
        <tbody>{jobs.map((job, idx) => <tr key={idx}><td className="fw-semibold">{job.company}</td><td>{job.role}</td><td>{job.location}</td><td>{job.distance || 'N/A'}</td><td>{job.career_website ? <a href={job.career_website} target="_blank" rel="noopener noreferrer">View posting</a> : 'N/A'}</td><td className="notes-cell">{job.notes || 'N/A'}</td></tr>)}</tbody>
      </Table>
    </div>
  );

  return <section ref={resultsRef} className="search-results mt-4" aria-label="Search results" tabIndex="-1">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3"><div><div className="portal-eyebrow">Results</div><h2 className="h3 mb-0">Opportunities near you</h2></div><Badge bg="success" pill>{(results.recent?.length || 0) + (results.older?.length || 0)} matches</Badge></div>
    <Card className="result-group border-0 mb-4"><Card.Header className="bg-transparent border-0 pt-3"><h3 className="h5 mb-1 text-success">Currently hiring</h3><p className="small mb-0">Active opportunities that may be ready for an application.</p></Card.Header><Card.Body className="pt-1">{results.recent?.length ? renderTable(results.recent) : <Alert variant="light" className="mb-0">No currently hiring jobs found.</Alert>}</Card.Body></Card>
    <Card className="result-group border-0"><Card.Header className="bg-transparent border-0 pt-3"><h3 className="h5 mb-1 text-warning-emphasis">Other matching jobs</h3><p className="small mb-0">Listings that meet your criteria but are not marked as currently hiring.</p></Card.Header><Card.Body className="pt-1">{results.older?.length ? renderTable(results.older) : <Alert variant="light" className="mb-0">No other matching jobs found.</Alert>}</Card.Body></Card>
  </section>;
}

function HotJobSearch({ user }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [searchMode, setSearchMode] = useState('type-location');
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  const returnToDashboard = () => navigate(user ? (user.role === 'admin' ? '/admin-dashboard' : '/dashboard') : '/');

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      resultsRef.current.focus({ preventScroll: true });
    }
  }, [results]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const data = searchMode === 'company'
      ? { search_type: 'company', company_name: formData.get('company_name') || '' }
      : (() => {
        const jobTypes = formData.getAll('job_type');
        const otherJobType = formData.get('other_job_type');
        if (otherJobType && otherJobType.trim() !== '') {
          jobTypes.push(otherJobType.trim());
        }
        return {
        search_type: 'type-location',
        job_types: jobTypes,
        address: formData.get('address'),
        radius: formData.get('radius')
        };
      })();

    try {
      const response = await fetch('/api/search-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();

      if (resultData.success) {
        setResults(resultData.results);
      } else {
        alert('Search failed: ' + (resultData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
  <main className="app-container search-page">
    <Card className={`glass-panel main-form border-0 shadow-sm search-shell${results ? ' has-results' : ''}`}>
    <div className="search-hero">
      <div><div className="portal-eyebrow">GoodJobNet job bank</div><h1 className="mb-2">Find your next opportunity</h1><p className="subtitle">Search screened listings by location, role, or company. Start broad, then refine your search.</p></div>
      <div className="search-hero-icon"><i className="bi bi-search" aria-hidden="true" /></div>
    </div>

    <Form onSubmit={handleSearch}>
      <div className="search-mode-switch mb-4" role="group" aria-label="Search method">
      <Form.Check type="radio" id="type-location" name="search_mode" value="type-location" label="Job type + location" checked={searchMode === 'type-location'} onChange={() => { setSearchMode('type-location'); setResults(null); }} />
      <Form.Check type="radio" id="company" name="search_mode" value="company" label="Company name" checked={searchMode === 'company'} onChange={() => { setSearchMode('company'); setResults(null); }} />
      </div>

      {searchMode === 'company' ? (
      <Form.Group className="search-primary-field" controlId="company-name">
        <Form.Label>Company name</Form.Label><Form.Control type="text" name="company_name" placeholder="For example, Walmart or Disney" required autoFocus />
      </Form.Group>
      ) : (
      <Row className="g-4">
        <Col lg={5}><Form.Group controlId="job-type"><Form.Label>Job types</Form.Label><MultiSelect name="job_type" options={JOB_OPTIONS} value={selectedJobTypes} onChange={setSelectedJobTypes} size={7} /><Form.Text id="job_type-selection-help">Click roles to select or clear them.</Form.Text></Form.Group></Col>
        <Col lg={7}><Form.Group controlId="address" className="mb-3"><Form.Label>Starting address</Form.Label><Form.Control as="textarea" name="address" rows={3} placeholder="Street, city, or ZIP code" /></Form.Group><Row className="g-3"><Col sm={8}><Form.Group controlId="other-job-type"><Form.Label>Another job type <span className="fw-normal text-muted">(optional)</span></Form.Label><Form.Control type="text" name="other_job_type" placeholder="Add a role not listed" /></Form.Group></Col><Col sm={4}><Form.Group controlId="radius"><Form.Label>Radius <span className="fw-normal text-muted">(miles)</span></Form.Label><Form.Control type="number" name="radius" defaultValue="20" min="1" /></Form.Group></Col></Row></Col>
      </Row>
      )}

      <Stack direction="horizontal" gap={2} className="justify-content-end mt-4 search-actions"><Button type="button" variant="outline-secondary" onClick={returnToDashboard}>Back</Button><Button type="submit" className="primary-btn px-4" disabled={loading}><i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-search'} me-2`} aria-hidden="true" />{loading ? 'Searching...' : 'Search jobs'}</Button></Stack>
    </Form>
    {results && <JobResults results={results} resultsRef={resultsRef} />}
    </Card>
  </main>
  );
}

export default HotJobSearch;
