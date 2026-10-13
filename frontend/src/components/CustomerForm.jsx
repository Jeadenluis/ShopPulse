import { useState } from 'react';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s.-]{6,25}$/;

export default function CustomerForm({ initial, onSubmit, onCancel }) {
  const [v, setV] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '', status: 'active', ...initial });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!v.firstName.trim()) e.firstName = 'First name is required.';
    if (!v.lastName.trim()) e.lastName = 'Last name is required.';
    if (!v.email.trim()) e.email = 'Email is required.'; else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address.';
    if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
    return e;
  };
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate(); setErrors(e); setFormError('');
    if (Object.keys(e).length) return;
    setBusy(true);
    try { await onSubmit(v); }
    catch (err) { setErrors(err.details || {}); setFormError(err.message); setBusy(false); }
  };
  const field = (k, label, props = {}) => (
    <label className="field"><span>{label}</span><input value={v[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />{errors[k] && <small className="err">{errors[k]}</small>}</label>
  );
  return (
    <form onSubmit={submit} noValidate>
      <div className="grid-2">{field('firstName', 'First name *')}{field('lastName', 'Last name *')}</div>
      {field('email', 'Email *', { type: 'email' })}
      <div className="grid-2">{field('phone', 'Phone')}{field('city', 'City')}</div>
      <label className="field"><span>Status</span><select value={v.status} onChange={set('status')}><option value="active">Active</option><option value="lead">Lead</option><option value="inactive">Inactive</option></select></label>
      {formError && <div className="form-error">{formError}</div>}
      <div className="form-actions"><button type="button" className="btn" onClick={onCancel} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save customer'}</button></div>
    </form>
  );
}
