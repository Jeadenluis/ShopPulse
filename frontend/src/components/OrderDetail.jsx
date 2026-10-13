import { Badge } from './ui';
import { fmtDateTime, money } from '../utils';

export default function OrderDetail({ order }) {
  return (
    <div>
      <dl className="detail-grid">
        <div><dt>Customer</dt><dd>{order.customerName}</dd></div>
        <div><dt>Placed</dt><dd>{fmtDateTime(order.orderDate)}</dd></div>
        <div><dt>Payment</dt><dd><Badge value={order.paymentStatus} /></dd></div>
        <div><dt>Fulfillment</dt><dd><Badge value={order.fulfillmentStatus} /></dd></div>
        <div><dt>Source</dt><dd><Badge value={order.source} label={order.source === 'demo' ? 'Demo data' : order.source === 'woocommerce' ? 'WooCommerce' : 'Manual'} /></dd></div>
      </dl>
      <h4>Items</h4>
      {order.items?.length ? (
        <table className="table"><thead><tr><th>Product</th><th className="num">Qty</th><th className="num">Price</th></tr></thead>
          <tbody>{order.items.map((it, i) => <tr key={i}><td>{it.name}</td><td className="num">{it.qty}</td><td className="num">{money(it.price)}</td></tr>)}</tbody></table>
      ) : <p className="muted">No line items recorded for this order.</p>}
      <div className="total-row"><span>Order total</span><strong>{money(order.total)}</strong></div>
      {order.notes && <p className="muted">Customer note: {order.notes}</p>}
    </div>
  );
}
