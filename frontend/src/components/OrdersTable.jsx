import { Badge } from './ui';
import { fmtDate, money } from '../utils';

export default function OrdersTable({ orders, onSelect, compact }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Order</th>{!compact && <th>Customer</th>}<th>Date</th><th className="num">Total</th><th>Payment</th><th>Fulfillment</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={onSelect ? 'clickable' : ''} onClick={() => onSelect?.(o)}>
              <td><strong>{o.number}</strong>{o.source === 'demo' && <span className="tag">demo</span>}</td>
              {!compact && <td>{o.customerName}</td>}
              <td>{fmtDate(o.orderDate)}</td><td className="num">{money(o.total)}</td>
              <td><Badge value={o.paymentStatus} /></td><td><Badge value={o.fulfillmentStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
