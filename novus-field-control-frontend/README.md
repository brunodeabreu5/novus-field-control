# Novus Field Control — Web (admin)

## Deploy (Coolify / produção)

O `index.html` na raiz usa `/src/main.tsx` **só para desenvolvimento** (`npm run dev`). Em produção o Vite gera `dist/` com scripts em `/assets/*.js`.

- **Docker (recomendado):** use o `Dockerfile` deste diretório. Ele builda com o Vite e serve `dist/` via nginx na porta **80**, com fallback de SPA para as rotas do react-router. No Coolify, Build Pack **Dockerfile** e Base Directory `novus-field-control-frontend`.
- **Site estático no Coolify:** build `npm ci && npm run build` e defina a pasta publicada como **`dist`** (não a raiz do repositório).

Variável de build: `VITE_CONTROL_API_URL` (URL pública da API + `/api`). Ver `.env.example`.

> Ela precisa existir **no build**, não só no runtime: o Vite injeta as variáveis `VITE_*` no bundle na hora de compilar. No Coolify, basta declará-la nas variáveis da aplicação — elas são repassadas como build args.

## Desenvolvimento

```sh
npm install
npm run dev
```
