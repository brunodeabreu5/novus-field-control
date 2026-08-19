import "dotenv/config";

function required(name: string, fallback = "") {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isTruthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isProductionEnvironment(): boolean {
  return (process.env.NODE_ENV || "development").trim().toLowerCase() === "production";
}

export const env = {
  nodeEnv: (process.env.NODE_ENV || "development").trim().toLowerCase(),
  port: Number(process.env.PORT || 4010),
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:8081")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL"),
  directUrl: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessTtl: process.env.JWT_ACCESS_TTL || "8h",
    refreshTtl: process.env.JWT_REFRESH_TTL || "30d",
  },
  cookie: {
    /**
     * O refresh token viaja em cookie httpOnly. Em producao o painel e a API
     * costumam ficar em origens distintas, o que exige SameSite=None — e o
     * navegador so aceita None junto de Secure. Em desenvolvimento tudo roda em
     * localhost (mesmo site), entao Lax basta e dispensa HTTPS.
     */
    secure:
      process.env.COOKIE_SECURE === undefined
        ? isProductionEnvironment()
        : isTruthy(process.env.COOKIE_SECURE),
    sameSite: (process.env.COOKIE_SAMESITE ||
      (isProductionEnvironment() ? "none" : "lax")
    ).trim().toLowerCase() as "lax" | "strict" | "none",
    domain: process.env.COOKIE_DOMAIN?.trim() || undefined,
  },
  enableSwagger:
    process.env.ENABLE_SWAGGER === undefined
      ? !isProductionEnvironment()
      : isTruthy(process.env.ENABLE_SWAGGER),
};

// SameSite=None sem Secure e descartado silenciosamente pelo navegador: o
// usuario simplesmente nunca conseguiria manter a sessao. Melhor falhar no boot.
if (env.cookie.sameSite === "none" && !env.cookie.secure) {
  throw new Error(
    "COOKIE_SAMESITE=none requires COOKIE_SECURE=true (browsers reject insecure SameSite=None cookies).",
  );
}
