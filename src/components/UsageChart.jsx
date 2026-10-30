import { formatNumber } from '../api.js';

const DAY = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });

export default function UsageChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.tokens));
  const total = days.reduce((sum, d) => sum + d.tokens, 0);

  return (
    <div className="card">
      <div className="card-head">
        <h3>Uso de los últimos 7 días</h3>
        <span className="muted small">{formatNumber(total)} tokens</span>
      </div>

      <div className="chart">
        {days.map((d, i) => {
          const date = new Date(`${d.date}T12:00:00`);
          const isToday = i === days.length - 1;
          return (
            <div
              key={d.date}
              className="chart-col"
              title={`${d.date}: ${formatNumber(d.tokens)} tokens · ${d.requests} requests`}
            >
              <span className="chart-value">{d.tokens ? formatNumber(d.tokens) : ''}</span>
              <div className="chart-track">
                <div
                  className={`chart-bar ${isToday ? 'today' : ''}`}
                  style={{ height: `${(d.tokens / max) * 100}%` }}
                />
              </div>
              <span className="chart-label">{isToday ? 'hoy' : DAY.format(date).replace('.', '')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
