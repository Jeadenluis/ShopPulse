import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../services/useApi';
import { useApp } from '../context/AppContext';
import { Badge, ConfirmDialog, EmptyState, ErrorState, Modal, Spinner } from '../components/ui';
import CustomerForm from '../components/CustomerForm';
import CustomerDetail from '../components/CustomerDetail';
import OrderDetail from '../components/OrderDetail';
import { fmtDate, money } from '../utils';

const CATEGORIES = ['all', 'New', 'Repeat', 'VIP', 'Inactive', 'No orders'];

export default function Customers() {
  const { toast, bump } = useApp();
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') || '';
  const [q, setQ] = useState(urlQ);
  const [debounced, setDebounced] = useState(urlQ);
  const category = params.get('category') || 'all';
  const [modal, setModal] = useState(null); // {type:'view'|'add'|'edit'|'delete'|'order', ...}
  const [busy, setBusy] = useState(false);

  useEffect(() => { setQ(urlQ); setDebounced(urlQ); }, [urlQ]);
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useApi(() => api.customers({ q: debounced, category }), [debounced, category]);

  const setCategory = (c) => { const p = new URLSearchParams(params); if (c === 'all') p.delete('category'); else p.set('category', c); setParams(p, { replace: true }); };
  const save = async (v) => {
    if (modal.type === 'edit') { await api.updateCustomer(modal.customer.id, v); toast('success', 'Customer updated.'); }
    else { await api.createCustomer(v); toast('success', 'Customer added.'); }
    setModal(null); bump();
  };
  const remove = async () => {
    setBusy(true);
    try { await api.deleteCustomer(modal.customer.id); toast('success', `${modal.customer.fullName} was deleted.`); setModal(null); bump(); }
    catch (e) { toast('error', e.message); } finally { setBusy(false); }
  };

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Customers</h1><p className="muted">Search, filter and manage everyone who has shopped with you.</p></div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} />Add customer</button></div>
      <div className="card">
        <div className="toolbar">
          <input className="input" placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">{CATEGORIES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}</select>
        </div>
        {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? (
          <EmptyState title="No customers found" text={debounced || category !== 'all' ? 'Try a different search or filter.' : 'Add your first customer to get started.'} />
        ) : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th className="num">Orders</th><th className="num">Spent</th><th>Category</th><th>Status</th><th>Last order</th><th /></tr></thead>
            <tbody>{data.map((c) => (
              <tr key={c.id}>
                <td className="muted">#{c.id}</td>
                <td><strong>{c.fullName}</strong>{c.source === 'demo' && <span className="tag">demo</span>}<br /><span className="muted small">{c.email}</span></td>
                <td>{c.phone || '—'}</td><td className="num">{c.totalOrders}</td><td className="num">{money(c.totalSpent)}</td>
                <td><Badge value={c.category} /></td><td><Badge value={c.status} /></td><td>{fmtDate(c.lastOrderDate)}</td>
                <td className="actions">
                  <button className="icon-btn" title="View details" aria-label={`View ${c.fullName}`} onClick={() => setModal({ type: 'view', customer: c })}><Eye size={16} /></button>
                  <button className="icon-btn" title="Edit" aria-label={`Edit ${c.fullName}`} onClick={() => setModal({ type: 'edit', customer: c })}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title="Delete" aria-label={`Delete ${c.fullName}`} onClick={() => setModal({ type: 'delete', customer: c })}><Trash2 size={16} /></button>
                </td>
              </tr>))}</tbody></table></div>
        )}
      </div>
      {modal?.type === 'view' && <Modal wide title="Customer details" onClose={() => setModal(null)}><CustomerDetail id={modal.customer.id} onSelectOrder={(o) => setModal({ type: 'order', order: o, customer: modal.customer })} /></Modal>}
      {modal?.type === 'order' && <Modal title={`Order ${modal.order.number}`} onClose={() => setModal({ type: 'view', customer: modal.customer })}><OrderDetail order={{ ...modal.order, customerName: modal.customer.fullName }} /></Modal>}
      {(modal?.type === 'add' || modal?.type === 'edit') && <Modal title={modal.type === 'add' ? 'Add customer' : 'Edit customer'} onClose={() => setModal(null)}><CustomerForm initial={modal.customer} onSubmit={save} onCancel={() => setModal(null)} /></Modal>}
      {modal?.type === 'delete' && <ConfirmDialog title="Delete customer?" busy={busy} onCancel={() => setModal(null)} onConfirm={remove}
        message={`This permanently deletes ${modal.customer.fullName} and their ${modal.customer.totalOrders} order(s) from ShopPulse. This cannot be undone.`} />}
    </div>
  );
}
