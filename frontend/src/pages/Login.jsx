import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        alert(data.error || 'Invalid credentials');
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
        const userRole = responseData.role || (data.calling === 'Employment Center missionary/volunteer' ? 'admin' : 'user');
        onLogin({
          name: data.name || data.username,
          role: userRole,
          ward: data.ward || "",
          stake: data.stake || "",
          email: data.email || "",
          phone: data.phone || ""
        });
        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
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

        <div className="nav-grid mb-2">
          <button type="button" onClick={() => navigate('/job-seeker-dashboard')} className="nav-card" style={{ border: '2px solid #3a7bd5', margin: '0 auto', maxWidth: '300px' }}>
            <h3 style={{ color: '#3a7bd5' }}>I am looking for a job</h3>
          </button>
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
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
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
                <input type="text" name="name" required value={username} onChange={e => setUsername(e.target.value)} />
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
                <input type="password" name="password" minLength="8" required />
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
