const pad = (n) => String(n).padStart(2, '0');
const clock = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export default function RateLimitCounter({ status, resetSeconds, blockedSeconds }) {
  const unlimited = status.requestsPerMinuteLimit < 0;
  const limit = status.requestsPerMinuteLimit;
  const used = status.requestsThisMinute;
  const blocked = blockedSeconds > 0;

  return (
    <div className={`card ${blocked ? 'card-blocked' : ''}`}>
      <div className="card-head">
        <h3>Requests por minuto</h3>
        <span className="countdown" title="Tiempo hasta que el scheduler reinicie el contador">
          ⟳ {clock(blocked ? blockedSeconds : resetSeconds)}
        </span>
      </div>

      <div className="big-number">
        {used}
        <span> / {unlimited ? '∞' : limit}</span>
      </div>

      {!unlimited && (
        <div className="dots">
          {Array.from({ length: Math.min(limit, 60) }, (_, i) => (
            <span key={i} className={i < used ? 'dot used' : 'dot'} />
          ))}
        </div>
      )}

      <p className="small muted">
        {blocked
          ? `Límite alcanzado. Podrás enviar de nuevo en ${blockedSeconds} s.`
          : unlimited
            ? 'Tu plan no tiene límite de requests por minuto.'
            : `Te quedan ${Math.max(0, limit - used)} requests. El contador se reinicia en ${resetSeconds} s.`}
      </p>
    </div>
  );
}
