import { useState } from 'react';
import { Activity } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { authenticate, health, toast } = useApp();
  const [mode, setMode] = useState('login');
  const [v, setV] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setErrors({});
    const local = {};
    if (mode === 'register' && !v.name.trim()) local.name = 'Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) local.email = 'Enter a valid email address.';
    if (!v.password) local.password = 'Password is required.'; else if (mode === 'register' && v.password.length < 8) local.password = 'Use at least 8 characters.';
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    try { const res = mode === 'login' ? await api.login(v) : await api.register(v); authenticate(res); toast('success', `Welcome, ${res.user.name}.`); }
    catch (err) { setError(err.message); setErrors(err.details || {}); } finally { setBusy(false); }
  };
  const down = health?.status === 'down';
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand dark"><Activity size={24} /><span>ShopPulse</span></div>
        <h2>{mode === 'login' ? 'Log in to your CRM' : 'Create an account'}</h2>
        <p className="muted">Customers, orders and follow-ups for your WooCommerce store.</p>
        {down && <div className="form-error">The backend is not reachable. Start it with <code>npm start</code> in the backend folder.</div>}
        <form onSubmit={submit} noValidate>
          {mode === 'register' && <label className="field"><span>Name</span><input value={v.name} onChange={set('name')} autoComplete="name" />{errors.name && <small className="err">{errors.name}</small>}</label>}
          <label className="field"><span>Email</span><input type="email" value={v.email} onChange={set('email')} autoComplete="email" />{errors.email && <small className="err">{errors.email}</small>}</label>
          <label className="field"><span>Password</span><input type="password" value={v.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />{errors.password && <small className="err">{errors.password}</small>}</label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <button className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setErrors({}); }}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Log in'}</button>
        {health?.demoLogin && mode === 'login' && (
          <div className="demo-hint"><strong>Local demo login</strong><span>admin@shoppulse.local / Demo@1234</span><button className="btn btn-sm" onClick={() => setV({ ...v, email: 'admin@shoppulse.local', password: 'Demo@1234' })}>Fill in</button></div>
        )}
      </div>
    </div>
  );
}
