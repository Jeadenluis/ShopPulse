import { useEffect } from 'react';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';

export const Spinner = ({ label = 'Loading…' }) => <div className="center-box"><Loader2 className="spin" size={22} /><span>{label}</span></div>;
export const EmptyState = ({ title, text, action }) => (
  <div className="center-box empty"><Inbox size={28} /><strong>{title}</strong>{text && <span>{text}</span>}{action}</div>
);
export const ErrorState = ({ error, onRetry }) => (
  <div className="center-box error-box"><AlertTriangle size={26} /><strong>Could not load data</strong><span>{error?.message}</span>{onRetry && <button className="btn" onClick={onRetry}>Try again</button>}</div>
);

const TONES = { paid: 'green', completed: 'green', active: 'green', shipped: 'blue', processing: 'blue', pending: 'amber', lead: 'blue', failed: 'red', refunded: 'gray', cancelled: 'gray', inactive: 'gray', VIP: 'purple', Repeat: 'blue', New: 'green', Inactive: 'gray', 'No orders': 'gray', open: 'amber', drafted: 'blue', demo: 'amber', woocommerce: 'purple', manual: 'gray' };
export const Badge = ({ value, label }) => <span className={`badge badge-${TONES[value] || 'gray'}`}>{label || String(value).replace(/^./, (c) => c.toUpperCase())}</span>;

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export const ConfirmDialog = ({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) => (
  <Modal title={title} onClose={onCancel}>
    <p className="muted">{message}</p>
    <div className="form-actions"><button className="btn" onClick={onCancel} disabled={busy}>Cancel</button><button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button></div>
  </Modal>
);

export const DemoBanner = ({ children }) => <div className="banner"><AlertTriangle size={16} /><span>{children}</span></div>;
