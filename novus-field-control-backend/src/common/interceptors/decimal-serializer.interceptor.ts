import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Campos monetarios sao Decimal no banco para que a aritmetica seja exata, mas
 * `JSON.stringify` serializa Decimal como string ("1234.56"). Os clientes tipam
 * esses campos como number e fazem contas com eles, entao a conversao acontece
 * aqui, uma unica vez, na saida da API.
 *
 * Converter na borda mantem a precisao onde ela importa (armazenamento e somas)
 * sem espalhar Decimal pelo contrato HTTP.
 */
export function serializeDecimals(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  if (value === null || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(serializeDecimals);
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = serializeDecimals(item);
  }

  return result;
}

@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data: unknown) => serializeDecimals(data)));
  }
}
