import { Link } from 'react-router-dom';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Clock, Repeat, ShoppingCart, Users, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../services/useApi';
import { useApp } from '../context/AppContext';
import { Badge, DemoBanner, EmptyState, ErrorState, Spinner } from '../components/ui';
import OrdersTable from '../components/OrdersTable';
import { fmtDateTime, money, timeAgo } from '../utils';

const STATUS_TEXT = { never: 'Never synchronized', success: 'Last sync succeeded', failed: 'Last sync failed', not_configured: 'Not configured' };

function SyncCard() {
  const { woo, syncing, syncNow } = useApp();
  const s = woo?.sync;
  return (
    <div className="card">
      <div className="card-head"><h3>WooCommerce sync</h3><span className={`badge badge-${s?.status === 'success' ? 'green' : s?.status === 'failed' ? 'red' : 'amber'}`}>{STATUS_TEXT[s?.status] || 'Checking…'}</span></div>
      <p className="muted small">{woo?.configured ? `Store: ${woo.storeHost}` : 'No WooCommerce credentials are set, so ShopPulse is using demo data.'}</p>
      {s && <p className="small">{s.message}</p>}
      <p className="small muted">Last successful sync: <strong>{s?.lastSuccessAt ? fmtDateTime(s.lastSuccessAt) : 'Never'}</strong></p>
      <button className="btn" onClick={syncNow} disabled={syncing}><RefreshCw size={15} className={syncing ? 'spin' : ''} />{syncing ? 'Syncing…' : 'Sync Now'}</button>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useApi(() => api.stats(), []);
  if (loading && !data) return <Spinner label="Loading dashboard…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const t = data.totals;
  const cards = [
    { label: 'Total customers', value: t.customers, icon: Users, tone: 'blue' },
    { label: 'Total orders', value: t.orders, icon: ShoppingCart, tone: 'green' },
    { label: 'Pending orders', value: t.pendingOrders, icon: Clock, tone: 'amber' },
    { label: 'Repeat customers', value: t.repeatCustomers, icon: Repeat, tone: 'purple' },
  ];
  return (
    <div className="stack">
      <div className="page-head"><div><h1>Dashboard</h1><p className="muted">Customer relationships and order activity at a glance.</p></div></div>
      {data.dataSources.includes('demo') && <DemoBanner>Showing demo data: sample customers and orders, not a live WooCommerce store. Records from a successful sync are labeled separately.</DemoBanner>}
      <div className="grid-4">{cards.map((c) => <div key={c.label} className="card stat"><div className={`stat-icon tone-${c.tone}`}><c.icon size={20} /></div><div><span className="muted small">{c.label}</span><strong>{c.value}</strong></div></div>)}</div>
      <div className="grid-main">
        <div className="card">
          <div className="card-head"><h3>Order activity, last 6 months</h3></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.monthly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis yAxisId="l" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} /><YAxis yAxisId="r" orientation="right" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v, n) => (n === 'Revenue' ? money(v) : v)} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="l" dataKey="orders" name="Orders" fill="#2f6fdd" radius={[4, 4, 0, 0]} barSize={26} />
              <Line yAxisId="r" dataKey="revenue" name="Revenue" stroke="#0f9f8f" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Needs follow-up</h3><Link className="link" to="/followups">View all ({t.openFollowups})</Link></div>
          {data.followups.length ? <ul className="list">{data.followups.map((f) => (
            <li key={f.id}><div><strong>{f.customerName}</strong><span className="muted small">{f.reason}</span></div><span className="tag">{f.ruleLabel}</span></li>
          ))}</ul> : <EmptyState title="All caught up" text="No open follow-ups right now." />}
        </div>
      </div>
      <div className="grid-main">
        <div className="card">
          <div className="card-head"><h3>Recent orders</h3><Link className="link" to="/orders">All orders</Link></div>
          {data.recentOrders.length ? <OrdersTable orders={data.recentOrders} /> : <EmptyState title="No orders yet" />}
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>Customer activity</h3></div>
            {data.activity.length ? <ul className="list">{data.activity.map((a) => <li key={a.id}><div><span>{a.text}</span><span className="muted small">{timeAgo(a.at)} · {money(a.total)}</span></div></li>)}</ul> : <EmptyState title="No activity yet" />}
          </div>
          <SyncCard />
        </div>
      </div>
      <div className="card"><div className="card-head"><h3>Customer categories</h3></div>
        <div className="chips">{Object.entries(data.categories).map(([k, n]) => <Link key={k} to={`/customers?category=${encodeURIComponent(k)}`} className="chip"><Badge value={k} /><strong>{n}</strong></Link>)}</div></div>
    </div>
  );
}
