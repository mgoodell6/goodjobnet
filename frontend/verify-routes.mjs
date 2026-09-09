// Server-render the route tree with isolated in-memory storage. No browser or API writes.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { signInDestination } from './src/signInDestination.js';

assert.equal(signInDestination('/job-seeker-search'), '/job-seeker-search');
assert.equal(signInDestination('/hot-jobs-review?category=5days'), '/hot-jobs-review?category=5days');
for (const from of [undefined, '//outside.example', 'https://outside.example', '/login']) {
  assert.equal(signInDestination(from), '/employment-dashboard');
}

const values = new Map();
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
globalThis.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { location: new URL('http://localhost/'), history: { state: { idx: 0 }, replaceState() {} }, addEventListener() {}, removeEventListener() {} };
globalThis.document = { defaultView: window };
globalThis.fetch = () => { throw new Error('Route rendering must not perform API operations'); };
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const render = path => { window.location = new URL(path, 'http://localhost'); return renderToString(React.createElement(App)); };
  const privatePages = {
    '/employment-dashboard': 'Your community at a glance',
    '/dashboard': 'Your community at a glance',
    '/job-entry': 'Job Entry Form',
    '/job-seeker-entry': 'Job Seeker Entry',
    '/job-seeker-search': 'Job Seeker Search',
    '/assigned-job-seekers': 'Assigned Job Seekers List',
    '/hot-jobs-review': 'Review Hot Jobs',
    '/hot-jobs-5review': 'Review Hot Jobs',
    '/hot-jobs-46review': 'Review Hot Jobs',
    '/admin-page': 'System Administration',
    '/create': 'What would you like to add?',
  };
  for (const [path, title] of Object.entries(privatePages)) {
    const html = render(path);
    assert(!html.includes(title), 'Private content rendered while signed out: ' + path);
    assert(!html.includes('href="/job-seeker-search"'), 'Private navigation leaked: ' + path);
  }
  for (const [path, title] of Object.entries({ '/': 'Your next chapter starts here.', '/hot-job-search': 'Job Search', '/help': 'Information &amp; Help', '/map': 'Opportunities near you', '/apps': 'Everything you need', '/login': 'Sign in' })) {
    assert(render(path).includes(title), 'Public page failed to render: ' + path);
  }
  values.set('goodjobnet_user', JSON.stringify({ name: 'Test Reviewer', role: 'admin' }));
  for (const [path, title] of Object.entries(privatePages)) assert(render(path).includes(title), 'Signed-in page failed to render: ' + path);
  assert(render('/search').includes('People'), 'Signed-in universal search is missing people');
  assert(!render('/apps').includes('Page not found'), 'App catalog has an incorrect breadcrumb');
  assert(render('/search?q=Retail').includes('value="Retail"'), 'Header search lost the URL query');
  assert(render('/job-entry').includes('for="jobentry-company_name"'), 'Entry labels are not associated with controls');
  values.set('goodjobnet_user', '{broken-json');
  assert(!render('/job-entry').includes('Job Entry Form'), 'Malformed user state bypassed access guard');
  values.clear();
  assert(!render('/search').includes('href="/job-seeker-search"'), 'Signed-out search leaked private navigation');
  console.log('PASS: 11 private routes blocked signed out and rendered signed in; 6 public pages rendered; malformed state and public search verified. No API calls.');
} finally { await server.close(); }
