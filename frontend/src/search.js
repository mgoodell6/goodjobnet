// Compose the existing read-only search operations without changing their contracts.
export async function searchWorkspace(query, user, signal, request = fetch) {
  const post = async (endpoint, payload) => {
    const response = await request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Search is temporarily unavailable.');
    return data.results;
  };
  const operations = [post('/api/search-jobs', { search_type: 'type-location', job_types: [], address: '', radius: '20' })];
  if (user) {
    operations.push(post('/api/search-seekers', { name: query, job_types: [], address: '', radius: '20' }));
    operations.push(post('/api/search-seekers', { name: '', job_types: [query], address: '', radius: '20' }));
  }
  const responses = await Promise.allSettled(operations);
  if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = job => terms.every(term => [job.company, job.role, job.location, job.notes].join(' ').toLowerCase().includes(term));
  const jobResult = responses[0].status === 'fulfilled' ? responses[0].value : {};
  const jobs = [...(jobResult.recent || []).map(job => ({ ...job, hiring: true })), ...(jobResult.older || []).map(job => ({ ...job, hiring: false }))].filter(matches);
  const people = new Map();
  responses.slice(1).forEach(result => {
    if (result.status === 'fulfilled') [...(result.value.nearby || []), ...(result.value.other || [])].forEach(person => people.set(person.row_index, person));
  });
  return { jobs, people: [...people.values()], errors: responses.flatMap((result, i) => result.status === 'rejected' ? [(i === 0 ? 'Jobs' : 'People') + ': ' + result.reason.message] : []).filter((item, i, list) => list.indexOf(item) === i) };
}
