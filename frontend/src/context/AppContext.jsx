import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../services/api';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const ICONS = { success: CheckCircle2, error: XCircle, info: Info };

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => { try { return getToken() ? JSON.parse(localStorage.getItem('sp_user')) : null; } catch { return null; } });
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState(null);
  const [woo, setWoo] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  const toast = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const logout = useCallback(() => { setToken(null); localStorage.removeItem('sp_user'); setUser(null); }, []);
  const authenticate = useCallback((res) => { setToken(res.token); localStorage.setItem('sp_user', JSON.stringify(res.user)); setUser(res.user); }, []);
  useEffect(() => { setUnauthorizedHandler(() => { logout(); toast('error', 'Your session expired. Please log in again.'); }); }, [logout, toast]);

  const refreshStatus = useCallback(async () => {
    try { setHealth(await api.health()); } catch { setHealth({ status: 'down' }); }
    if (getToken()) { try { setWoo(await api.wooStatus()); } catch { /* shown via health */ } }
  }, []);
  useEffect(() => { refreshStatus(); }, [user, refreshStatus]);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    try { const r = await api.sync(); toast('success', r.sync.message); }
    catch (e) { toast('error', e.message); }
    finally { await refreshStatus(); setDataVersion((v) => v + 1); setSyncing(false); }
  }, [toast, refreshStatus]);

  const value = { user, authenticate, logout, toast, health, woo, syncing, syncNow, dataVersion, bump: () => setDataVersion((v) => v + 1), refreshStatus };
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => { const Icon = ICONS[t.type] || Info; return <div key={t.id} className={`toast toast-${t.type}`}><Icon size={18} /><span>{t.message}</span></div>; })}
      </div>
    </Ctx.Provider>
  );
}
