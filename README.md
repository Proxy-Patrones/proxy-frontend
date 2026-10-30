# Plataforma de consumo de IA con Proxy de rate limiting y cuotas — Frontend

Taller individual de **Patrones de Software** — patrón estructural **Proxy**.
Frontend en **React + Vite**. Consume el backend Spring Boot (repositorio aparte).

## Funcionalidades

- Chat para enviar prompts al servicio de IA simulado.
- Barra de progreso de la cuota mensual (tokens usados vs. disponibles), actualizada después de cada request.
- Contador de requests por minuto con cuenta regresiva hasta el reset.
- Al llegar al rate limit (HTTP 429): botón de envío deshabilitado y cuenta regresiva según el header `Retry-After`.
- Al agotar la cuota (HTTP 402): modal de upgrade con simulación de pago.
- Gráfica de barras con el uso de los últimos 7 días.
- Badge del plan actual (FREE / PRO / ENTERPRISE) con colores diferenciados.
- Estimador de tokens antes de enviar el prompt (1 token ≈ 4 caracteres, igual que el backend).

## Estructura

```
src/
├── api.js                  # llamadas al backend (header X-User-Id) y estimador de tokens
├── App.jsx                 # estado general: cuota, contador, bloqueo 429, modal 402
└── components/
    ├── Login.jsx           # ingreso por usuario + usuarios de demostración
    ├── Chat.jsx            # chat, estimador y botón con cuenta regresiva
    ├── QuotaBar.jsx        # barra de tokens del mes
    ├── RateLimitCounter.jsx# requests por minuto y countdown
    ├── UsageChart.jsx      # barras de los últimos 7 días
    ├── PlanBadge.jsx       # badge de color por plan
    └── UpgradeModal.jsx    # upgrade con pago simulado
```

## Ejecutar en local

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8080
npm run dev
```

## Despliegue en Vercel

1. **Add New → Project** → importar este repositorio (Vercel detecta Vite).
2. **Environment Variables**: `VITE_API_URL` = URL del backend en Railway (sin `/` al final).
3. **Deploy**.
4. Copiar la URL de Vercel y ponerla en la variable `FRONTEND_URL` del backend en Railway.
