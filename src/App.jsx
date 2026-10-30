import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api.js';
import Login from './components/Login.jsx';
import PlanBadge from './components/PlanBadge.jsx';
import Chat from './components/Chat.jsx';
import QuotaBar from './components/QuotaBar.jsx';
import RateLimitCounter from './components/RateLimitCounter.jsx';
import UsageChart from './components/UsageChart.jsx';
import UpgradeModal from './components/UpgradeModal.jsx';

const STORAGE_KEY = 'ai-cloud-user';

function readStoredUser() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [userId, setUserId] = useState(readStoredUser);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [resetAt, setResetAt] = useState(0); // cuándo se reinicia el contador por minuto
  const [blockedUntil, setBlockedUntil] = useState(0); // fin del bloqueo por 429
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState(null);
  const autoShown = useRef(false); // el modal se abre solo una vez por agotamiento

  const applyStatus = useCallback((s) => {
    setStatus(s);
    setResetAt(Date.now() + s.secondsUntilRateLimitReset * 1000);
    if (s.rateLimited) setBlockedUntil(Date.now() + s.secondsUntilRateLimitReset * 1000);
    if (s.quotaExhausted && !autoShown.current) {
      autoShown.current = true;
      setShowUpgrade(true);
    }
    if (!s.quotaExhausted) autoShown.current = false;
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [s, h] = await Promise.all([api.status(userId), api.history(userId)]);
      applyStatus(s);
      setHistory(h);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) logout();
    }
  }, [userId, applyStatus]);

  // Carga inicial y refresco periódico ("tiempo real")
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  // Reloj de 1 segundo para las cuentas regresivas
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Cuando llega el minuto nuevo, el scheduler del backend ya reseteó: volvemos a consultar
  useEffect(() => {
    if (resetAt && now >= resetAt + 500) {
      setResetAt(0);
      refresh();
    }
  }, [now, resetAt, refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  function login(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* el navegador puede bloquear el almacenamiento */
    }
    setMessages([]);
    setUserId(id);
  }

  function logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nada */
    }
    setUserId(null);
    setStatus(null);
    setMessages([]);
    setBlockedUntil(0);
    setShowUpgrade(false);
  }

  async function send(prompt) {
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setSending(true);
    try {
      const { response, quota } = await api.generate(userId, prompt);
      setMessages((m) => [...m, { role: 'ai', ...response }]);
      applyStatus(quota);
      setHistory(await api.history(userId));
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setMessages((m) => [...m, { role: 'error', code: status, text: e.message }]);
      if (status === 429) setBlockedUntil(Date.now() + (e.retryAfter || 60) * 1000);
      if (status === 402) setShowUpgrade(true);
      refresh();
    } finally {
      setSending(false);
    }
  }

  async function upgraded(newStatus) {
    applyStatus(newStatus);
    setShowUpgrade(false);
    setBlockedUntil(0);
    setToast(`¡Pago aprobado! Ahora tienes el plan ${newStatus.plan}.`);
    refresh();
  }

  if (!userId) return <Login onLogin={login} />;

  const blockedSeconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));
  const resetSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));
  const quotaExhausted = status?.quotaExhausted ?? false;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">▲</span>
          <div>
            <strong>AI Cloud</strong>
            <small>Proxy de rate limiting y cuotas</small>
          </div>
        </div>
        <div className="topbar-right">
          {status && <PlanBadge plan={status.plan} />}
          <span className="user">@{userId}</span>
          {status && status.plan !== 'ENTERPRISE' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpgrade(true)}>
              Mejorar plan
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      <main className="layout">
        <Chat
          messages={messages}
          sending={sending}
          onSend={send}
          blockedSeconds={blockedSeconds}
          quotaExhausted={quotaExhausted}
          tokensRemaining={status?.tokensRemaining ?? -1}
          onUpgrade={() => setShowUpgrade(true)}
        />

        <aside className="sidebar">
          {status ? (
            <>
              <QuotaBar status={status} />
              <RateLimitCounter status={status} resetSeconds={resetSeconds} blockedSeconds={blockedSeconds} />
              <UsageChart days={history} />
            </>
          ) : (
            <div className="card muted">Cargando estado de la cuota…</div>
          )}
          <div className="card chain">
            <h3>Cadena del patrón Proxy</h3>
            <ol>
              <li>RateLimitProxyService <span>req/min → 429</span></li>
              <li>QuotaProxyService <span>tokens/mes → 402</span></li>
              <li>MockAIGenerationService <span>servicio real</span></li>
            </ol>
          </div>
        </aside>
      </main>

      {showUpgrade && status && (
        <UpgradeModal
          userId={userId}
          status={status}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={upgraded}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
