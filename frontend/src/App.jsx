import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import JobEntry from './pages/JobEntry';
import JobSeekerEntry from './pages/JobSeekerEntry';
import HotJobSearch from './pages/HotJobSearch';
import JobSeekerSearch from './pages/JobSeekerSearch';
import InformationAndHelp from './pages/InformationAndHelp';
import HotJobsReview from './pages/HotJobsReview';
import AssignedJobSeekersList from './pages/AssignedJobSeekersList';
import AdminPage from './pages/AdminPage';
import Shell from './components/Shell';
import Home from './pages/Home';
import UniversalSearch from './pages/UniversalSearch';
import { AppsPage, CreatePage, MapPage } from './pages/WorkspacePages';
import { signInDestination } from './signInDestination';
function readUser() {
  try { const saved = JSON.parse(localStorage.getItem('goodjobnet_user')); return saved && typeof saved.name === 'string' && saved.name && typeof saved.role === 'string' ? saved : null; } catch { return null; }
}
function Protected({ user }) {
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}
function SignInRoute({ user, onLogin }) {
  const location = useLocation();
  return user ? <Navigate to={signInDestination(location.state?.from)} replace /> : <Login onLogin={onLogin} />;
}
export default function App() {
  const [user, setUser] = useState(readUser);
  useEffect(() => {
    const sync = e => { if (e.key === 'goodjobnet_user' || e.key === null) setUser(readUser()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const handleLogin = data => { localStorage.setItem('goodjobnet_user', JSON.stringify(data)); setUser(data); };
  const handleLogout = () => { localStorage.removeItem('goodjobnet_user'); sessionStorage.removeItem('seeker_search_inputs'); sessionStorage.removeItem('seeker_search_results'); setUser(null); };
  return <BrowserRouter><Routes>
    <Route path="/login" element={<SignInRoute user={user} onLogin={handleLogin} />} />
    <Route element={<Shell user={user} onLogout={handleLogout} />}>
      <Route path="/" element={<Home user={user} />} />
      <Route path="/job-seeker-dashboard" element={<Home user={user} />} />
      <Route path="/hot-job-search" element={<HotJobSearch user={user} />} />
      <Route path="/search" element={<UniversalSearch key={user?.name || 'public'} user={user} />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/help" element={<InformationAndHelp />} />
      <Route path="/apps" element={<AppsPage user={user} />} />
      <Route element={<Protected user={user} />}>
        <Route path="/dashboard" element={<Home user={user} />} />
        <Route path="/employment-dashboard" element={<Home user={user} />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/job-entry" element={<JobEntry user={user} />} />
        <Route path="/job-seeker-entry" element={<JobSeekerEntry user={user} />} />
        <Route path="/hot-jobs-review" element={<HotJobsReview user={user} />} />
        <Route path="/hot-jobs-5review" element={<HotJobsReview user={user} />} />
        <Route path="/hot-jobs-46review" element={<HotJobsReview user={user} />} />
        <Route path="/admin-page" element={<AdminPage user={user} />} />
        <Route path="/assigned-job-seekers" element={<AssignedJobSeekersList user={user} />} />
        <Route path="/job-seeker-search" element={<JobSeekerSearch user={user} />} />
      </Route>
      <Route path="*" element={<div className="workspace-page empty-state"><h1>Page not found</h1><p>Choose an app from the left to keep going.</p></div>} />
    </Route>
  </Routes></BrowserRouter>;
}
