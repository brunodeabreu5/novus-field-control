# Novus Field Control — Web (admin)

## Deploy (Coolify / produção)

O `index.html` na raiz usa `/src/main.tsx` **só para desenvolvimento** (`npm run dev`). Em produção o Vite gera `dist/` com scripts em `/assets/*.js`.

- **Aplicação Node (Nixpacks/Docker):** use o `nixpacks.toml` deste repo — faz `npm run build` e `npm run start`, que serve **`dist/`** com [`serve`](https://www.npmjs.com/package/serve) (MIME correto para módulos JS).
- **Site estático no Coolify:** build `npm ci && npm run build` e defina a pasta publicada como **`dist`** (não a raiz do repositório).

Variável de build: `VITE_CONTROL_API_URL` (URL pública da API + `/api`). Ver `.env.example`.

## Desenvolvimento

```sh
npm install
npm run dev
```
