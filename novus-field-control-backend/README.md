# Novus Field Control Backend

Backend central do control plane do SaaS.

## Subida local

O padrão recomendado é subir a infraestrutura pela raiz do monorepo:

```bash
cd C:\novus-field-geral
docker compose up -d
```

Se preferir, este projeto mantém um `docker-compose.yml` compatível.

## Banco local

- PostgreSQL: `127.0.0.1:3441`
- Database: `novus_field_control`

## Setup

1. Rode as migrations:

```bash
npm run prisma:migrate -- --name init
```

2. Gere o admin inicial:

```bash
npm run prisma:seed
```

3. Inicie a API:

```bash
npm run start:dev
```

## Endpoints locais

- API: `http://127.0.0.1:4010/api`
- Swagger: `http://127.0.0.1:4010/docs`

## Credenciais iniciais

O login do painel web usa o admin criado pelo seed. Os valores vêm de **`SEED_ADMIN_EMAIL`** e **`SEED_ADMIN_PASSWORD`** no `.env` deste projeto (veja `.env.example`).

- Se você **não** definiu essas variáveis: email `admin@novusfield.com`, senha `admin123456`.
- Se você **definiu** `SEED_ADMIN_*` (como em ambientes locais compartilhados), use **esses** no login — o painel não lê o `.env` do backend automaticamente.