import { useEffect, useRef, useState } from 'react';
import { estimateTokens, formatNumber } from '../api.js';

const SUGGESTIONS = [
  '¿Qué es el patrón Proxy?',
  'Explícame el rate limiting con un ejemplo',
  '¿Para qué sirve Redis?',
];

export default function Chat({ messages, sending, onSend, blockedSeconds, quotaExhausted, tokensRemaining, onUpgrade }) {
  const [prompt, setPrompt] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const estimate = estimateTokens(prompt);
  const blocked = blockedSeconds > 0;
  const tooBig = tokensRemaining >= 0 && estimate > tokensRemaining;
  const disabled = sending || blocked || quotaExhausted || !prompt.trim() || tooBig;

  function submit(e) {
    e?.preventDefault();
    if (disabled) return;
    onSend(prompt.trim());
    setPrompt('');
  }

  let buttonText = 'Enviar';
  if (sending) buttonText = 'Generando…';
  else if (blocked) buttonText = `Espera ${blockedSeconds}s`;
  else if (quotaExhausted) buttonText = 'Sin cuota';

  return (
    <section className="chat card">
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <h2>¿En qué te ayudo hoy?</h2>
            <p className="muted">Cada mensaje pasa por el Proxy de rate limit y el Proxy de cuota antes de llegar a la IA.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className="msg msg-user">
                {m.text}
              </div>
            );
          }
          if (m.role === 'error') {
            return (
              <div key={i} className={`msg msg-error code-${m.code}`}>
                <strong>{m.code ? `HTTP ${m.code}` : 'Error'}</strong> {m.text}
                {m.code === 402 && (
                  <button className="btn btn-primary btn-sm" onClick={onUpgrade}>
                    Mejorar plan
                  </button>
                )}
              </div>
            );
          }
          return (
            <div key={i} className="msg msg-ai">
              <p>{m.text}</p>
              <span className="meta">
                {m.model} · {formatNumber(m.totalTokens)} tokens ({m.promptTokens} prompt + {m.completionTokens}{' '}
                respuesta) · {(m.processingTimeMs / 1000).toFixed(1)} s
              </span>
            </div>
          );
        })}

        {sending && (
          <div className="msg msg-ai typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        {blocked && (
          <div className="banner banner-warning">
            Alcanzaste el límite de requests por minuto. Podrás enviar de nuevo en <strong>{blockedSeconds} s</strong>.
          </div>
        )}
        {quotaExhausted && (
          <div className="banner banner-danger">
            Agotaste tu cuota mensual de tokens.{' '}
            <button type="button" className="link" onClick={onUpgrade}>
              Mejora tu plan
            </button>
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          placeholder="Escribe tu prompt… (Enter para enviar, Shift+Enter para salto de línea)"
          rows={3}
          maxLength={4000}
        />

        <div className="composer-foot">
          <span className={`estimate ${tooBig ? 'over' : ''}`}>
            {prompt.trim()
              ? `≈ ${formatNumber(estimate)} tokens de prompt + la respuesta (~60 tokens)`
              : 'El estimador de tokens aparece mientras escribes'}
            {tooBig && ' · supera tus tokens disponibles'}
          </span>
          <button className="btn btn-primary" disabled={disabled}>
            {buttonText}
          </button>
        </div>
      </form>
    </section>
  );
}
