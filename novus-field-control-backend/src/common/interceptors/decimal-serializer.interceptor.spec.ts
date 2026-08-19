import { Prisma } from "@prisma/client";
import { serializeDecimals } from "./decimal-serializer.interceptor";

describe("serializeDecimals", () => {
  it("converte Decimal para number", () => {
    expect(serializeDecimals(new Prisma.Decimal("1234.56"))).toBe(1234.56);
  });

  it("converte Decimal aninhado em objetos e arrays", () => {
    const payload = {
      summary: { totalPaid: new Prisma.Decimal("0.60") },
      items: [{ amount: new Prisma.Decimal("10.10") }, { amount: new Prisma.Decimal("20.20") }],
    };

    expect(serializeDecimals(payload)).toEqual({
      summary: { totalPaid: 0.6 },
      items: [{ amount: 10.1 }, { amount: 20.2 }],
    });
  });

  it("preserva Date, null e primitivos", () => {
    const date = new Date("2026-01-10T00:00:00.000Z");
    const payload = { date, nulo: null, texto: "abc", numero: 7, bool: true };

    expect(serializeDecimals(payload)).toEqual(payload);
    expect((serializeDecimals(payload) as { date: Date }).date).toBeInstanceOf(Date);
  });

  it("sem Decimal, o payload atravessa sem alteracao de valor", () => {
    const payload = { items: [{ id: "a" }, { id: "b" }], total: 2 };
    expect(serializeDecimals(payload)).toEqual(payload);
  });
});
