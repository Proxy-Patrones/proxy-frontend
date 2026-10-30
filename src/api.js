const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

async function request(path, { method = 'GET', body, userId } = {}) {
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Id': userId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el backend.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // El header Retry-After lo envía el RateLimitProxyService cuando responde 429
    const retryAfter = Number(res.headers.get('Retry-After') ?? data.retryAfterSeconds ?? 0);
    throw new ApiError(res.status, data.message || `Error ${res.status}`, retryAfter);
  }
  return data;
}

export const api = {
  login: (username) => request('/api/users/login', { method: 'POST', body: { username } }),
  plans: () => request('/api/users/plans'),
  generate: (userId, prompt) => request('/api/ai/generate', { method: 'POST', userId, body: { prompt } }),
  status: (userId) => request('/api/quota/status', { userId }),
  history: (userId) => request('/api/quota/history', { userId }),
  upgrade: (userId, payment) => request('/api/quota/upgrade', { method: 'POST', userId, body: payment }),
};

/** Misma fórmula que TokenEstimator del backend: 1 token ≈ 4 caracteres. */
export function estimateTokens(text) {
  const clean = text.trim();
  return clean ? Math.max(1, Math.ceil(clean.length / 4)) : 0;
}

export const formatNumber = (n) => new Intl.NumberFormat('es-CO').format(n);
