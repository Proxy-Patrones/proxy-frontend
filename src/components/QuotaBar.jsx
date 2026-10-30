import { formatNumber } from '../api.js';

export default function QuotaBar({ status }) {
  const unlimited = status.tokenLimit < 0;
  const percent = unlimited ? 100 : Math.min(100, (status.tokensUsed / status.tokenLimit) * 100);
  const level = unlimited ? 'unlimited' : percent >= 90 ? 'danger' : percent >= 70 ? 'warning' : 'ok';
  const resetDate = new Date(status.resetDate).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="card">
      <div className="card-head">
        <h3>Cuota mensual de tokens</h3>
        <span className="muted small">Se renueva el {resetDate}</span>
      </div>

      <div className="big-number">
        {formatNumber(status.tokensUsed)}
        <span> / {unlimited ? '∞' : formatNumber(status.tokenLimit)}</span>
      </div>

      <div className="progress">
        <div className={`progress-fill ${level}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="row-between small">
        <span className="muted">{unlimited ? 'Plan ilimitado' : `${percent.toFixed(1)} % usado`}</span>
        <span>
          {unlimited ? 'Sin límite' : `${formatNumber(status.tokensRemaining)} tokens disponibles`}
        </span>
      </div>
    </div>
  );
}
