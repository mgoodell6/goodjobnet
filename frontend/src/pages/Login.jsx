import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login({ onLogin }) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
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
        onLogin({
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
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert(`Network error: ${err.message || 'Unable to reach the server'}. Please check your internet connection or try again later.`);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const formElement = e.target;
      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());

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
      } else {
        alert(responseData.error || 'Registration failed');
      }
    } catch (err) {
      console.error("Registration Error:", err);
      alert(`Network error: ${err.message || 'Unable to reach the server'}. Please check your internet connection or try again later.`);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel main-form">
        <header>
          <h1>Welcome to GoodJobNet</h1>
          <p className="subtitle">Employment resource for LDS wards and stakes in the Central Florida area</p>
        </header>

        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p>This site helps keep the Orlando Employment Center aware of needs in the area and provides connection to employment opportunities that have been pre-screened.</p>
          <p><strong>Note:</strong> Log-in accounts are intended for use by church members in leadership roles.</p>
        </div>


        {!isCreatingAccount ? (
          <form onSubmit={handleLogin}>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="input-group full-width">
                <label>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-light)',
                      padding: '4px'
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="actions mt-2 mb-1">
              <button type="submit" className="btn primary-btn">Login</button>
            </div>
            <div className="text-center">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsCreatingAccount(true); }}>Need an account? Apply here.</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount}>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Name</label>
                <input type="text" name="name" required />
              </div>
              <div className="input-group">
                <label>Ward</label>
                <input type="text" name="ward" required />
              </div>
              <div className="input-group">
                <label>Stake</label>
                <input type="text" name="stake" required />
              </div>
              <div className="input-group full-width">
                <label>Calling</label>
                <select name="calling" required>
                  <option value="">Select...</option>
                  <option value="Bishop">Bishop</option>
                  <option value="Relief Society President">Relief Society President</option>
                  <option value="Elders Quorum President">Elders Quorum President</option>
                  <option value="Self-Reliance specialist">Self-Reliance specialist</option>
                  <option value="Employment Center missionary/volunteer">Church Employment Center missionary/volunteer</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="input-group">
                <label>Email (Optional)</label>
                <input type="email" name="email" />
              </div>
              <div className="input-group">
                <label>Phone (Optional)</label>
                <input type="tel" name="phone" />
              </div>
              <div className="input-group full-width">
                <label>Desired Username (Unique)</label>
                <input type="text" name="username" required />
              </div>
              <div className="input-group full-width">
                <label>Password (Min 8 chars)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    name="password"
                    minLength="8"
                    required
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-light)',
                      padding: '4px'
                    }}
                    aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegisterPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="actions mt-2 mb-1">
              <button type="submit" className="btn primary-btn">Create Account</button>
            </div>
            <div className="text-center">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsCreatingAccount(false); }}>Back to Login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
