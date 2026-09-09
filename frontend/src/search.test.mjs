import test from 'node:test';
import assert from 'node:assert/strict';
import { searchWorkspace } from './search.js';

const jobs = { recent: [{ company: 'Example Market', role: 'Retail cashier', location: 'Orlando', notes: '' }], older: [{ company: 'Example Store', role: 'Retail associate', location: 'Orlando', notes: '' }] };
const person = { row_index: 2, name: 'Example Person', desired_job_types: 'Retail' };
const response = results => ({ ok: true, json: async () => ({ success: true, results }) });

test('public search sends only the existing job search payload and preserves hiring groups', async () => {
  const calls = [];
  const result = await searchWorkspace('retail Orlando', null, undefined, async (url, options) => { calls.push([url, options]); return response(jobs); });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/api/search-jobs');
  assert.equal(calls[0][1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body), { search_type: 'type-location', job_types: [], address: '', radius: '20' });
  assert.deepEqual(result.jobs.map(job => job.hiring), [true, false]);
  assert.deepEqual(result.people, []);
});
test('signed-in search uses existing name and job-type contracts and deduplicates people', async () => {
  const calls = [];
  const result = await searchWorkspace('Retail', { name: 'Reviewer' }, undefined, async (url, options) => {
    calls.push([url, JSON.parse(options.body)]);
    return response(url === '/api/search-jobs' ? jobs : { nearby: [person], other: [person] });
  });
  assert.deepEqual(calls.slice(1), [
    ['/api/search-seekers', { name: 'Retail', job_types: [], address: '', radius: '20' }],
    ['/api/search-seekers', { name: '', job_types: ['Retail'], address: '', radius: '20' }],
  ]);
  assert.equal(result.people.length, 1);
  assert.equal(result.jobs.length, 2);
});
test('a failed source does not discard successful results', async () => {
  const result = await searchWorkspace('Retail', { name: 'Reviewer' }, undefined, async url => {
    if (url === '/api/search-jobs') throw new Error('Service unavailable');
    return response({ nearby: [person], other: [] });
  });
  assert.equal(result.people.length, 1);
  assert.deepEqual(result.errors, ['Jobs: Service unavailable']);
});
test('aborted searches cannot commit stale results', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(searchWorkspace('Retail', null, controller.signal, async () => response(jobs)), { name: 'AbortError' });
});
test('unmatched queries return no fabricated records', async () => {
  const result = await searchWorkspace('no-such-role', null, undefined, async () => response(jobs));
  assert.deepEqual(result.jobs, []);
  assert.deepEqual(result.people, []);
  assert.deepEqual(result.errors, []);
});
