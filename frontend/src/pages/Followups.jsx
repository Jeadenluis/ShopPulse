import { useState } from 'react';
import { Check, Copy, Info, Save } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../services/useApi';
import { useApp } from '../context/AppContext';
import { Badge, EmptyState, ErrorState, Spinner } from '../components/ui';
import { copyText, fmtDateTime } from '../utils';

const STATUS_LABEL = { open: 'Not drafted', drafted: 'Draft saved · not sent', completed: 'Marked completed' };

function FollowupCard({ rec, onChanged }) {
  const { toast } = useApp();
  const [message, setMessage] = useState(rec.draftMessage);
  const [busy, setBusy] = useState(false);
  const done = rec.followupStatus === 'completed';
  const save = async (status) => {
    setBusy(true);
    try { await api.saveFollowup({ customerId: rec.customerId, ruleType: rec.ruleType, message, status }); toast('success', status === 'completed' ? `Follow-up with ${rec.customerName} marked completed.` : 'Draft saved. It has not been sent.'); onChanged(); }
    catch (e) { toast('error', e.message); } finally { setBusy(false); }
  };
  const copy = async () => { const ok = await copyText(message); toast(ok ? 'success' : 'error', ok ? 'Message copied. Paste it into your email or chat app to send it.' : 'Copy failed. Select the text and copy it manually.'); };
  return (
    <div className={`card followup ${done ? 'is-done' : ''}`}>
      <div className="card-head"><div><h3>{rec.customerName}</h3><span className="muted small">{rec.email}</span></div>
        <div className="badges"><span className="tag">{rec.ruleLabel}</span><Badge value={rec.followupStatus} label={STATUS_LABEL[rec.followupStatus]} /></div></div>
      <p className="small"><strong>Why:</strong> {rec.reason}</p>
      <p className="small"><strong>Suggested action:</strong> {rec.suggestedAction}</p>
      <label className="field"><span>Draft message {rec.followupStatus === 'open' && <em className="muted">(template, not saved yet)</em>}</span>
        <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} disabled={done} /></label>
      <div className="form-actions left">
        <button className="btn" onClick={copy}><Copy size={15} />Copy message</button>
        {!done && <button className="btn" onClick={() => save('drafted')} disabled={busy}><Save size={15} />Save draft</button>}
        {!done ? <button className="btn btn-primary" onClick={() => save('completed')} disabled={busy}><Check size={15} />Mark completed</button>
          : <span className="muted small">Completed {fmtDateTime(rec.completedAt)}</span>}
      </div>
    </div>
  );
}

export default function Followups() {
  const [status, setStatus] = useState('open'); const [rule, setRule] = useState('all');
  const { bump } = useApp();
  const { data, loading, error, reload } = useApi(() => api.followups({ status: status === 'active' ? '' : status, rule }), [status, rule]);
  const list = data ? (status === 'active' ? data.filter((r) => r.followupStatus !== 'completed') : data) : [];
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Follow-ups</h1><p className="muted">Rule-based suggestions: pending orders, 60+ days without an order, and loyal repeat customers.</p></div></div>
      <div className="notice"><Info size={18} /><span><strong>ShopPulse does not send messages.</strong> A saved draft is only a draft. Copy it, send it from your own email or chat app, then mark the follow-up completed.</span></div>
      <div className="toolbar">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by follow-up status">
          <option value="open">Not drafted</option><option value="drafted">Draft saved</option><option value="active">All to do (not drafted + drafted)</option><option value="completed">Completed</option><option value="all">All</option></select>
        <select className="input" value={rule} onChange={(e) => setRule(e.target.value)} aria-label="Filter by reason">
          <option value="all">All reasons</option><option value="pending_order">Pending order</option><option value="inactive_60d">No order in 60+ days</option><option value="repeat_customer">Repeat customer</option></select>
      </div>
      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : !list.length ? <EmptyState title="Nothing here" text="No follow-ups match these filters." /> : (
        <div className="grid-cards">{list.map((r) => <FollowupCard key={`${r.id}-${r.followupStatus}`} rec={r} onChanged={bump} />)}</div>)}
    </div>
  );
}
