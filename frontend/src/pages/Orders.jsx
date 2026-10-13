import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../services/useApi';
import { EmptyState, ErrorState, Modal, Spinner } from '../components/ui';
import OrdersTable from '../components/OrdersTable';
import OrderDetail from '../components/OrderDetail';

export default function Orders() {
  const [q, setQ] = useState(''); const [dq, setDq] = useState('');
  const [status, setStatus] = useState('all'); const [payment, setPayment] = useState('all');
  const [selected, setSelected] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useApi(() => api.orders({ q: dq, status, payment }), [dq, status, payment]);
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Orders</h1><p className="muted">Track payment and fulfillment for every order.</p></div></div>
      <div className="card">
        <div className="toolbar">
          <input className="input" placeholder="Search by order ID or customer name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by fulfillment status">
            <option value="all">All fulfillment</option>{['pending', 'processing', 'shipped', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
          <select className="input" value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Filter by payment status">
            <option value="all">All payment</option>{['paid', 'pending', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
        </div>
        {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.length ? <EmptyState title="No orders match" text="Try a different search or status filter." /> : <OrdersTable orders={data} onSelect={setSelected} />}
      </div>
      {selected && <Modal title={`Order ${selected.number}`} onClose={() => setSelected(null)}><OrderDetail order={selected} /></Modal>}
    </div>
  );
}
