import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react';
import { signInDestination } from '../signInDestination';

export default function Login({ onLogin }) {
  const [register, setRegister] = useState(false);
  const [step, setStep] = useState('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { document.title = 'Sign in | GoodJobNet'; }, []);
  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!register && step === 'username') { setStep('password'); return; }
    setBusy(true);
    try {
      const payload = register ? Object.fromEntries(new FormData(e.currentTarget).entries()) : { username, password };
      const response = await fetch(register ? '/api/register' : '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Unable to reach the sign-in service. Please try again.');
      const data = await response.json();
      if (!data.success) throw new Error((data.error || 'Unable to sign in. Check your username and password.') + (data.details ? ' ' + data.details : ''));
      if (register) { setRegister(false); setStep('username'); setNotice('Account created successfully. You can now sign in.'); }
      else {
        onLogin({ name: data.name || username, role: data.role, ward: data.ward || '', stake: data.stake || '', email: data.email || '', phone: data.phone || '' });
        navigate(signInDestination(location.state?.from), { replace: true });
      }
    } catch (err) { setError(err.message || 'Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  };
  const switchMode = () => { setRegister(!register); setStep('username'); setError(''); setVisible(false); };
  return <div className="login-page"><div className="login-ambient" aria-hidden="true" /><div className={'login-stack ' + (register ? 'registration-stack' : '')}><section className="login-card"><Link to="/" className="login-brand"><span className="brand-mark"><span /><span /><span /></span>GoodJobNet</Link>
    {!register && step === 'password' && <button className="login-identity" type="button" onClick={() => { setStep('username'); setError(''); }}><ArrowLeft size={16} />{username}</button>}
    <h1>{register ? 'Create your account' : step === 'username' ? 'Sign in' : 'Enter password'}</h1><p>{register ? 'Apply for access to the employment workspace.' : step === 'username' ? 'to continue to GoodJobNet' : 'Use your GoodJobNet account password.'}</p>
    {error && <p className="login-error" role="alert">{error}</p>}{notice && <p className="login-notice" role="status">{notice}</p>}
    <form onSubmit={submit}>
      {register ? <div className="form-grid"><div className="input-group full-width"><label htmlFor="register-name">Name</label><input id="register-name" name="name" required autoComplete="name" /></div><div className="input-group"><label htmlFor="register-email">Email (optional)</label><input id="register-email" type="email" name="email" autoComplete="email" /></div><div className="input-group"><label htmlFor="register-phone">Phone (optional)</label><input id="register-phone" type="tel" name="phone" autoComplete="tel" /></div><div className="input-group full-width"><label htmlFor="register-username">Choose a unique username</label><input id="register-username" name="username" required autoComplete="username" /></div><div className="input-group full-width"><label htmlFor="register-password">Password (at least 8 characters)</label><div className="password-field"><input id="register-password" type={visible ? 'text' : 'password'} name="password" minLength={8} required autoComplete="new-password" /><button type="button" className="icon-button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div></div>
      : step === 'username' ? <div className="input-group"><label className="sr-only" htmlFor="login-username">Username</label><input key="username" id="login-username" autoFocus required autoComplete="username" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} /></div>
      : <div className="input-group"><label className="sr-only" htmlFor="login-password">Password</label><div className="password-field"><input key="password" id="login-password" autoFocus type={visible ? 'text' : 'password'} required autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} /><button type="button" className="icon-button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>}
      <div className="login-links">{register ? <button type="button" onClick={switchMode}>Already have an account? Sign in</button> : <><span>Need an account? <button type="button" onClick={switchMode}>Apply here</button></span><Link to="/help">Need help signing in?</Link></>}</div><div className="login-actions"><button type="submit" className="login-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : step === 'username' ? 'Next' : 'Sign in'}</button></div>
    </form></section><Link to="/" className="login-options"><KeyRound size={21} /><span>Looking for a job? Explore without signing in</span><ArrowRight size={17} /></Link><p className="login-context">Workspace accounts are intended for church members in leadership roles serving wards and stakes in Central Florida.</p></div><footer className="login-footer"><span>GoodJobNet · Orlando Employment Center</span><Link to="/help">Help & contact</Link></footer></div>;
}
