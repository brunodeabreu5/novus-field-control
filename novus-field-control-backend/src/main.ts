import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { env } from "./config/env";

function isAllowedCorsOrigin(origin: string | undefined) {
  if (!origin) {
    return true;
  }

  if (env.corsOrigin.includes(origin)) {
    return true;
  }

  if (env.nodeEnv !== "production") {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }

  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS origin not allowed: ${origin ?? "unknown"}`));
      },
      credentials: true,
    },
  });

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Novus Field Control API")
    .setDescription("Central control plane API for tenant registry and discovery.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  if (env.enableSwagger) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(env.port);
}

void bootstrap();
