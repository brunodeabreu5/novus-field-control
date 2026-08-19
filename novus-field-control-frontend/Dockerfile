# ---------- build ----------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# O Vite injeta as variaveis VITE_* no bundle em tempo de build, entao a URL da
# API precisa chegar como build arg — definir apenas no runtime nao tem efeito.
ARG VITE_CONTROL_API_URL
ENV VITE_CONTROL_API_URL=$VITE_CONTROL_API_URL

RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
