import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

// Loads data on mount, whenever deps change, and after a WooCommerce sync (dataVersion).
export function useApi(fn, deps = []) {
  const { dataVersion } = useApp();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await fn(); if (mine === seq.current) setState({ data, loading: false, error: null }); }
    catch (error) { if (mine === seq.current) setState((s) => ({ ...s, loading: false, error })); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, dataVersion]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
