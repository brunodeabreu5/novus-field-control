import { beforeEach, describe, expect, it, vi } from "vitest";

describe("request() — renovacao de sessao concorrente", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("compartilha uma unica renovacao entre requisicoes simultaneas com 401", async () => {
    let refreshCalls = 0;
    let sessaoRenovada = false;

    const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = String(url);

      if (path.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        // O backend rotaciona o refresh token guardado no cookie: uma segunda
        // chamada concorrente usaria um valor ja invalidado.
        if (refreshCalls > 1) {
          return new Response(JSON.stringify({ message: "Invalid refresh token" }), { status: 401 });
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        sessaoRenovada = true;
        return new Response(
          JSON.stringify({ accessToken: "novo", user: { id: "1", email: "a@b.c" } }),
          { status: 200 },
        );
      }

      const auth = new Headers(init.headers).get("Authorization");
      if (!sessaoRenovada || auth !== "Bearer novo") {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const api = await import("@/lib/api");
    const storage = await import("@/lib/storage");
    storage.writeAuthState({
      accessToken: "expirado",
      user: { id: "1", email: "a@b.c" } as never,
    });

    const results = await Promise.all([
      api.listTenants({}),
      api.listProvisioningProjects({}),
      api.listBillingInvoices({}),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    expect(storage.readAuthState()?.accessToken).toBe("novo");
  });

  it("envia credentials para o cookie httpOnly acompanhar a requisicao", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const api = await import("@/lib/api");
    await api.listTenants({});

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/tenants"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("nao guarda nada em localStorage", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ accessToken: "t", user: { id: "1" } }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const api = await import("@/lib/api");
    await api.login("a@b.c", "senha");

    expect(localStorage.length).toBe(0);
  });
});
