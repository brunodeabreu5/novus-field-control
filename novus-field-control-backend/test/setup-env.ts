/**
 * `src/config/env.ts` valida as variaveis obrigatorias no momento do import,
 * entao qualquer teste que carregue um modulo dependente dele precisa delas
 * definidas. Valores ficticios: nenhum teste unitario abre conexao real.
 */
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@127.0.0.1:5432/test";
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";
