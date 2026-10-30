import { useState } from 'react';
import { api, formatNumber } from '../api.js';

const PLANS = [
  { name: 'PRO', price: 20, rpm: '60 req/min', tokens: '500.000 tokens/mes' },
  { name: 'ENTERPRISE', price: 99, rpm: 'Requests ilimitadas', tokens: 'Tokens ilimitados' },
];
const ORDER = ['FREE', 'PRO', 'ENTERPRISE'];

const formatCard = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function UpgradeModal({ userId, status, onClose, onUpgraded }) {
  const available = PLANS.filter((p) => ORDER.indexOf(p.name) > ORDER.indexOf(status.plan));
  const [plan, setPlan] = useState(available[0]?.name);
  const [form, setForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' });
  const [step, setStep] = useState('form'); // form | processing
  const [error, setError] = useState('');

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const selected = PLANS.find((p) => p.name === plan);

  async function pay(e) {
    e.preventDefault();
    setError('');
    setStep('processing');
    await new Promise((r) => setTimeout(r, 1500)); // simulación de la pasarela de pagos
    try {
      const newStatus = await api.upgrade(userId, { plan, ...form });
      onUpgraded(newStatus);
    } catch (err) {
      setError(err.message);
      setStep('form');
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && step === 'form' && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <button className="close" onClick={onClose} disabled={step === 'processing'} aria-label="Cerrar">
          ×
        </button>

        <h2>{status.quotaExhausted ? 'Agotaste tu cuota mensual' : 'Mejora tu plan'}</h2>
        <p className="muted">
          {status.quotaExhausted
            ? `Usaste ${formatNumber(status.tokensUsed)} de ${formatNumber(status.tokenLimit)} tokens del plan ${status.plan}. Mejora tu plan para seguir usando la IA.`
            : `Tu plan actual es ${status.plan}. Elige un plan superior.`}
        </p>

        <div className="plan-options">
          {available.map((p) => (
            <button
              type="button"
              key={p.name}
              className={`plan-option ${plan === p.name ? 'selected' : ''} plan-${p.name.toLowerCase()}`}
              onClick={() => setPlan(p.name)}
            >
              <strong>{p.name}</strong>
              <span className="price">
                ${p.price}
                <small>/mes</small>
              </span>
              <small>{p.rpm}</small>
              <small>{p.tokens}</small>
            </button>
          ))}
        </div>

        {step === 'processing' ? (
          <div className="processing">
            <div className="spinner" />
            <p>Procesando el pago con la pasarela (simulación)…</p>
          </div>
        ) : (
          <form className="pay-form" onSubmit={pay}>
            <label>
              Titular
              <input value={form.cardHolder} onChange={(e) => set('cardHolder', e.target.value)} placeholder="Nombre como aparece en la tarjeta" required />
            </label>
            <label>
              Número de tarjeta
              <input
                value={form.cardNumber}
                onChange={(e) => set('cardNumber', formatCard(e.target.value))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                required
              />
            </label>
            <div className="two">
              <label>
                Vencimiento
                <input value={form.expiry} onChange={(e) => set('expiry', formatExpiry(e.target.value))} placeholder="MM/AA" inputMode="numeric" required />
              </label>
              <label>
                CVV
                <input
                  value={form.cvv}
                  onChange={(e) => set('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  required
                />
              </label>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary full" disabled={!plan}>
              Pagar ${selected?.price ?? 0} y activar {plan}
            </button>
            <small className="muted center">
              Pago simulado: no se cobra nada ni se guarda la tarjeta. Prueba con 4242 4242 4242 4242; las terminadas en 0000 se rechazan.
            </small>
          </form>
        )}
      </div>
    </div>
  );
}
