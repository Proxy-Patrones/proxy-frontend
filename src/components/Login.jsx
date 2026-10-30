import { useState } from 'react';
import { api } from '../api.js';

const DEMOS = [
  { id: 'demo-free', label: 'demo-free', hint: 'FREE · casi sin cuota' },
  { id: 'demo-pro', label: 'demo-pro', hint: 'PRO' },
  { id: 'demo-enterprise', label: 'demo-enterprise', hint: 'ENTERPRISE' },
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function enter(name) {
    setError('');
    setLoading(true);
    try {
      const { userId } = await api.login(name);
      onLogin(userId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <span className="logo big">▲</span>
        <h1>AI Cloud</h1>
        <p className="muted">Plataforma de consumo de IA con Proxy de rate limiting y cuotas</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enter(username);
          }}
        >
          <label htmlFor="username">Nombre de usuario</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej. juandavid"
            autoComplete="off"
          />
          <button className="btn btn-primary" disabled={loading || !username.trim()}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
          <small className="muted">Si el usuario no existe se crea con el plan FREE.</small>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="demos">
          <span className="muted">o prueba con un usuario de demostración</span>
          <div className="demo-list">
            {DEMOS.map((d) => (
              <button key={d.id} className="demo" disabled={loading} onClick={() => enter(d.id)}>
                <strong>{d.label}</strong>
                <small>{d.hint}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
