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
  enableSwagger:
    process.env.ENABLE_SWAGGER === undefined
      ? !isProductionEnvironment()
      : isTruthy(process.env.ENABLE_SWAGGER),
};
