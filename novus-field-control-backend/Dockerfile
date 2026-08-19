# ---------- build ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Instala com o lockfile antes de copiar o resto, para aproveitar o cache de
# camadas quando so o codigo-fonte muda.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime

# openssl e exigido pelo motor de migracoes do Prisma; curl serve ao healthcheck.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4010

# Roda como usuario sem privilegio desde a instalacao: assim o node_modules ja
# nasce com o dono certo e evita-se um `chown -R` recursivo, que duplicaria a
# camada inteira na imagem final.
RUN chown node:node /app
USER node

# Somente dependencias de producao. A CLI do Prisma esta em `dependencies`
# porque o start roda `prisma migrate deploy`; o seed usa o JS ja compilado pelo
# nest build, dispensando o tsx.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts

# Gera o Prisma Client para as dependencias desta imagem.
RUN npx prisma generate

EXPOSE 4010

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["sh", "-c", "npm run prisma:deploy && npm run prisma:seed:prod && exec npm run start"]
