import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Button, Card, Form } from 'react-bootstrap';

function Login({ onLogin }) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'signup');
  const [loginStep, setLoginStep] = useState('username');
  const [registrationStep, setRegistrationStep] = useState('name');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [registrationData, setRegistrationData] = useState({ name: '', ward: '', stake: '', calling: '', email: '', phone: '', username: '', password: '', confirmPassword: '' });
  const [isFlowTransitioning, setIsFlowTransitioning] = useState(false);
  const [flowTransitionPhase, setFlowTransitionPhase] = useState('idle');
  const loginCardRef = useRef(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSigningIn) return;
    if (!username.trim()) {
      setLoginStep('username');
      setFieldError('Enter your username');
      return;
    }
    if (!password) {
      setFieldError('Enter your password');
      return;
    }
    setFieldError('');
    setIsSigningIn(true);
    setIsAdvancing(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        alert(`Server Configuration Error: The server returned HTML instead of JSON. This usually means the API is down or not properly routed. Status: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        await onLogin({
          name: data.name || username,
          role: data.role,
          ward: data.ward || "",
          stake: data.stake || "",
          email: data.email || "",
          phone: data.phone || ""
        });
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        alert((data.error || 'Invalid credentials') + (data.details ? '\n\nDetails: ' + data.details : ''));
        setIsSigningIn(false);
        setIsAdvancing(false);
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert(`Network error: ${err.message || 'Unable to reach the server'}. Please check your internet connection or try again later.`);
      setIsSigningIn(false);
      setIsAdvancing(false);
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setFieldError('Enter your username');
      return;
    }
    setFieldError('');
    if (username.trim() && !isAdvancing) {
      setTransitionDirection('forward');
      setIsAdvancing(true);
    }
  };
  const handleStepTransitionEnd = (event) => {
    if (event.animationName !== 'login-progress' || transitionDirection !== 'forward' || isSigningIn) return;
    if (isCreatingAccount) {
      const nextSteps = { name: 'organization', organization: 'contact', contact: 'credentials' };
      setRegistrationStep(nextSteps[registrationStep] || registrationStep);
    } else {
      setLoginStep('password');
    }
    setIsAdvancing(false);
  };

  const handleBackToUsername = () => {
    if (!isAdvancing) {
      setTransitionDirection('backward');
      setLoginStep('username');
    }
  };

  const updateRegistrationField = (field, value) => {
    setRegistrationData(current => ({ ...current, [field]: value }));
    setRegistrationError('');
  };

  const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validPhone = value => value.replace(/\D/g, '').length >= 10;

  const advanceRegistration = () => {
    if (isAdvancing) return;
    const errors = {
      name: !registrationData.name.trim() ? 'Enter your name' : !registrationData.username.trim() ? 'Enter your username' : '',
      organization: !registrationData.ward.trim() ? 'Enter your ward' : !registrationData.stake.trim() ? 'Enter your stake' : !registrationData.calling ? 'Select your calling' : '',
      contact: !validEmail(registrationData.email) ? 'Enter a valid email address' : !validPhone(registrationData.phone) ? 'Enter a valid phone number' : '',
    };
    const error = errors[registrationStep] || '';
    if (error) {
      setRegistrationError(error);
      return;
    }
    setRegistrationError('');
    setTransitionDirection('forward');
    const nextSteps = { name: 'organization', organization: 'contact', contact: 'password' };
    setRegistrationStep(nextSteps[registrationStep] || registrationStep);
  };

  const skipRegistrationContact = () => {
    if (!isAdvancing) {
      setRegistrationError('');
      setTransitionDirection('forward');
      setRegistrationStep('password');
    }
  };

  const backRegistration = () => {
    const previousSteps = { organization: 'name', contact: 'organization', password: 'contact' };
    if (!isAdvancing && previousSteps[registrationStep]) {
      setTransitionDirection('backward');
      setRegistrationStep(previousSteps[registrationStep]);
      setRegistrationError('');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (registrationData.password !== registrationData.confirmPassword) {
      setRegistrationError('Passwords do not match');
      return;
    }
    if (!registrationData.username.trim() || !registrationData.password) {
      setRegistrationError(!registrationData.username.trim() ? 'Enter your username' : 'Enter your password');
      return;
    }
    try {
      setIsSigningIn(true);
      setIsAdvancing(true);
      const data = { ...registrationData };
      delete data.confirmPassword;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        alert(`Server Configuration Error: The server returned HTML instead of JSON. This usually means the API is down or not properly routed. Status: ${response.status}`);
        return;
      }

      const responseData = await response.json();
      if (responseData.success) {
        alert("Account request submitted successfully!\n\nAn administrator must manually approve your account before you can log in. Please check back later.");
        setIsCreatingAccount(false);
        setIsSigningIn(false);
        setIsAdvancing(false);
        setRegistrationError('');
        setRegistrationStep('name');
        setRegistrationData({ name: '', ward: '', stake: '', calling: '', email: '', phone: '', username: '', password: '', confirmPassword: '' });
      } else {
        alert(responseData.error || 'Registration failed');
        setIsSigningIn(false);
        setIsAdvancing(false);
      }
    } catch (err) {
      console.error("Registration Error:", err);
      alert(`Network error: ${err.message || 'Unable to reach the server'}. Please check your internet connection or try again later.`);
      setIsSigningIn(false);
      setIsAdvancing(false);
    }
  };

  const switchAuthFlow = (createAccount) => {
    if (createAccount === isCreatingAccount || isFlowTransitioning) return;

    const card = loginCardRef.current;
    if (!card) {
      setIsCreatingAccount(createAccount);
      return;
    }

    setIsFlowTransitioning(true);
    setFlowTransitionPhase('fade-out');
    window.setTimeout(() => {
      setIsCreatingAccount(createAccount);
      window.requestAnimationFrame(() => {
        setFlowTransitionPhase('fade-in');
        window.setTimeout(() => {
          setFlowTransitionPhase('fade-in-active');
          window.setTimeout(() => {
            setFlowTransitionPhase('idle');
            setIsFlowTransitioning(false);
          }, 170);
        }, 320);
      });
    }, 170);
  };

  return (
    <main className={`login-page auth-flow-${flowTransitionPhase}`}>
      <Card ref={loginCardRef} className={`login-card border-0${isFlowTransitioning ? ' auth-flow-transitioning' : ''} auth-flow-${flowTransitionPhase}`}>
              {!isCreatingAccount && (isAdvancing || isSigningIn) && <div className={`login-transition-bar${isSigningIn ? ' login-loading-bar' : ''}`} role="progressbar" aria-label={isSigningIn ? 'Loading your dashboard' : 'Loading sign-in step'}><span onAnimationEnd={handleStepTransitionEnd} /></div>}
        {!isCreatingAccount ? (
          <div className="login-layout">
            <section className="login-intro">
              <div className="login-mark">GJ</div>
              <h1>Sign in to GoodJobNet</h1>
              <p>Access screened employment opportunities and resources from the Orlando Employment Center.</p>
            </section>
            <section className="login-form-panel" aria-label="Sign in">
              {loginStep === 'username' ? (
                <form key="username-step" className={`login-step-panel${transitionDirection === 'backward' ? ' login-step-backward' : ''}`} onSubmit={handleUsernameSubmit} noValidate>
                  <div className="login-step-heading">
                    <h2>Sign in</h2>
                    <p className="login-account-hint">Use your GoodJobNet account</p>
                  </div>
                  <Form.Group controlId="login-username" className="login-field login-floating-field">
                    <Form.Control type="text" name="username" placeholder=" " autoComplete="username" autoCorrect="off" autoCapitalize="none" spellCheck="false" autoFocus value={username} onChange={e => { setUsername(e.target.value); setFieldError(''); }} aria-invalid={Boolean(fieldError)} aria-describedby="username-error" />
                    <Form.Label>Username</Form.Label>
                    <div id="username-error" className="login-field-error" role="alert">{fieldError}</div>
                  </Form.Group>
                  <div className="login-background-password" aria-hidden="true">
                    <Form.Control type="password" name="password" tabIndex="-1" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="login-form-actions">
                    <a href="#" onClick={(e) => { e.preventDefault(); switchAuthFlow(true); }}>Create an account</a>
                    <Button type="submit" className="primary-btn login-next" disabled={isAdvancing}>Next</Button>
                  </div>
                </form>
              ) : (
                <form key="password-step" className={`login-step-panel${transitionDirection === 'forward' ? ' login-step-forward' : ''}`} onSubmit={handleLogin} noValidate>
                  <div className="login-step-heading">
                    <h2>Welcome Back</h2>
                    <button type="button" className="login-identity" onClick={() => setLoginStep('username')} aria-label="Change username">{username}</button>
                  </div>
                  <Form.Group controlId="login-password" className="login-field login-floating-field">
                    <div className="password-field">
                      <Form.Control type={showPassword ? 'text' : 'password'} name="password" placeholder=" " autoComplete="current-password" autoCorrect="off" autoCapitalize="none" spellCheck="false" autoFocus value={password} onChange={e => { setPassword(e.target.value); setFieldError(''); }} aria-invalid={Boolean(fieldError)} aria-describedby="password-error" />
                      <Form.Label>Password</Form.Label>
                      <Button variant="link" type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </Button>
                    </div>
                    <div id="password-error" className="login-field-error" role="alert">{fieldError}</div>
                  </Form.Group>
                  <div className="login-form-actions login-password-actions">
                    <button type="button" className="login-back" onClick={handleBackToUsername} disabled={isAdvancing}>BACK</button>
                    <Button type="submit" className="primary-btn login-next" disabled={isSigningIn}>Sign in</Button>
                  </div>
                </form>
              )}
              <p className="login-note"><strong>Note:</strong> Accounts are intended for church members in leadership roles.</p>
            </section>
          </div>
        ) : (
          <div className="login-layout registration-layout">
            <section className="login-intro">
              <div className="login-mark">GJ</div>
              <h1>Create your account</h1>
              <p>Request access to screened employment opportunities and resources from the Orlando Employment Center.</p>
            </section>
            <section className="login-form-panel" aria-label="Create account">
              {registrationStep === 'name' && <form className={`login-step-panel login-registration-step${transitionDirection === 'backward' ? ' login-step-backward' : transitionDirection === 'forward' ? ' login-step-forward' : ''}`} onSubmit={e => { e.preventDefault(); advanceRegistration(); }} noValidate>
                <div className="login-step-heading"><h2>Create account</h2><p className="login-account-hint">Tell us your name</p></div>
                <Form.Group controlId="register-name" className="login-field login-floating-field registration-name-field"><Form.Control type="text" name="name" placeholder=" " autoFocus value={registrationData.name} onChange={e => updateRegistrationField('name', e.target.value)} /><Form.Label>Name</Form.Label></Form.Group>
                <Form.Group controlId="register-username" className="login-field login-floating-field"><Form.Control type="text" name="username" placeholder=" " autoComplete="username" autoCorrect="off" autoCapitalize="none" spellCheck="false" value={registrationData.username} onChange={e => updateRegistrationField('username', e.target.value)} /><Form.Label>Username</Form.Label><div className="login-field-error" role="alert">{registrationError}</div></Form.Group>
                <div className="login-form-actions"><a href="#" onClick={e => { e.preventDefault(); switchAuthFlow(false); }}>Back to Login</a><Button type="submit" className="primary-btn login-next">Next</Button></div>
              </form>}
              {registrationStep === 'organization' && <form className={`login-step-panel login-registration-step${transitionDirection === 'backward' ? ' login-step-backward' : ' login-step-forward'}`} onSubmit={e => { e.preventDefault(); advanceRegistration(); }} noValidate>
                <div className="login-step-heading"><h2>Your community</h2><p className="login-account-hint">Ward, stake, and calling</p></div>
                <div className="form-grid registration-organization-fields">
                  <Form.Group controlId="register-ward" className="login-field login-floating-field"><Form.Control type="text" name="ward" placeholder=" " value={registrationData.ward} onChange={e => updateRegistrationField('ward', e.target.value)} /><Form.Label>Ward</Form.Label></Form.Group>
                  <Form.Group controlId="register-stake" className="login-field login-floating-field"><Form.Control type="text" name="stake" placeholder=" " value={registrationData.stake} onChange={e => updateRegistrationField('stake', e.target.value)} /><Form.Label>Stake</Form.Label></Form.Group>
                </div>
                <Form.Group controlId="register-calling" className="login-field login-floating-field"><Form.Select name="calling" className={registrationData.calling ? 'has-value' : ''} value={registrationData.calling} onChange={e => updateRegistrationField('calling', e.target.value)}><option value=""> </option><option value="Bishop">Bishop</option><option value="Relief Society President">Relief Society President</option><option value="Elders Quorum President">Elders Quorum President</option><option value="Self-Reliance specialist">Self-Reliance specialist</option><option value="Employment Center missionary/volunteer">Church Employment Center missionary/volunteer</option><option value="Other">Other</option></Form.Select><Form.Label>Calling</Form.Label><div className="login-field-error" role="alert">{registrationError}</div></Form.Group>
                <div className="login-form-actions"><button type="button" className="login-back" onClick={backRegistration}>Back</button><Button type="submit" className="primary-btn login-next">Next</Button></div>
              </form>}
              {registrationStep === 'contact' && <form className={`login-step-panel login-registration-step${transitionDirection === 'backward' ? ' login-step-backward' : ' login-step-forward'}`} onSubmit={e => { e.preventDefault(); advanceRegistration(); }} noValidate>
                <div className="login-step-heading"><h2>Contact information</h2><p className="login-account-hint">How we can reach you</p></div>
                <Form.Group controlId="register-email" className="login-field login-floating-field"><Form.Control type="email" name="email" placeholder=" " autoComplete="email" value={registrationData.email} onChange={e => updateRegistrationField('email', e.target.value)} /><Form.Label>Email</Form.Label></Form.Group>
                <Form.Group controlId="register-phone" className="login-field login-floating-field"><Form.Control type="tel" name="phone" placeholder=" " autoComplete="tel" value={registrationData.phone} onChange={e => updateRegistrationField('phone', e.target.value)} /><Form.Label>Phone</Form.Label><div className="login-field-error" role="alert">{registrationError}</div></Form.Group>
                <div className="login-form-actions registration-contact-actions"><button type="button" className="login-back" onClick={backRegistration}>Back</button><div className="registration-contact-next"><button type="button" className="login-back" onClick={skipRegistrationContact}>Skip</button><Button type="submit" className="primary-btn login-next">Next</Button></div></div>
              </form>}
              {registrationStep === 'password' && <form className={`login-step-panel login-registration-step${transitionDirection === 'backward' ? ' login-step-backward' : ' login-step-forward'}`} onSubmit={handleCreateAccount} noValidate>
                <div className="login-step-heading"><h2>Create a password</h2><p className="login-account-hint">Protect your account</p></div>
                <Form.Group controlId="register-password" className="login-field login-floating-field"><div className="password-field"><Form.Control type={showRegisterPassword ? 'text' : 'password'} name="password" placeholder=" " autoComplete="new-password" minLength="8" autoFocus value={registrationData.password} onChange={e => updateRegistrationField('password', e.target.value)} /><Form.Label>Password</Form.Label><Button variant="link" type="button" className="password-toggle" onClick={() => setShowRegisterPassword(!showRegisterPassword)} aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}>{showRegisterPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}</Button></div></Form.Group>
                <Form.Group controlId="register-confirm-password" className="login-field login-floating-field"><div className="password-field"><Form.Control type={showRegisterPassword ? 'text' : 'password'} name="confirmPassword" placeholder=" " autoComplete="new-password" minLength="8" value={registrationData.confirmPassword} onChange={e => updateRegistrationField('confirmPassword', e.target.value)} /><Form.Label>Confirm Password</Form.Label></div><div className="login-field-error" role="alert">{registrationError}</div></Form.Group>
                <div className="login-form-actions"><button type="button" className="login-back" onClick={backRegistration} disabled={isSigningIn}>Back</button><Button type="submit" className="primary-btn login-next" disabled={isSigningIn}>Create Account</Button></div>
              </form>}
              <p className="login-note"><strong>Note:</strong> Your request will be reviewed by an administrator.</p>
            </section>
          </div>
        )}
      </Card>
      <p className="login-footer">GoodJobNet · Orlando Employment Center</p>
    </main>
  );
}

export default Login;
