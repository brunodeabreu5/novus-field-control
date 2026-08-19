import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Marca uma rota como acessivel sem autenticacao. Necessario porque o
 * JwtAuthGuard e global: sem esta anotacao, tudo exige token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
