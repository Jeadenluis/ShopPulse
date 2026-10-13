import { api } from '../services/api';
import { useApi } from '../services/useApi';
import { Badge, ErrorState, Spinner } from './ui';
import OrdersTable from './OrdersTable';
import { fmtDate, money } from '../utils';

export default function CustomerDetail({ id, onSelectOrder }) {
  const { data: c, loading, error, reload } = useApi(() => api.customer(id), [id]);
  if (loading && !c) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div>
      <div className="detail-head"><div className="avatar lg">{c.firstName[0]}{c.lastName[0]}</div><div><h4>{c.fullName}</h4><span className="muted">{c.email}</span></div><div className="badges"><Badge value={c.category} /><Badge value={c.status} /></div></div>
      <dl className="detail-grid">
        <div><dt>Customer ID</dt><dd>#{c.id}</dd></div><div><dt>Phone</dt><dd>{c.phone || '—'}</dd></div>
        <div><dt>City</dt><dd>{c.city || '—'}</dd></div><div><dt>Last order</dt><dd>{fmtDate(c.lastOrderDate)}</dd></div>
        <div><dt>Total orders</dt><dd>{c.totalOrders} ({c.completedOrders} completed)</dd></div><div><dt>Total spending</dt><dd>{money(c.totalSpent)}</dd></div>
      </dl>
      <h4>Order history</h4>
      {c.orders.length ? <OrdersTable orders={c.orders} compact onSelect={onSelectOrder} /> : <p className="muted">This customer has not placed any orders yet.</p>}
    </div>
  );
}
