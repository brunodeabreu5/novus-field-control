import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "novus_field_control_auth";

function seedAuth(accessToken: string, refreshToken: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ accessToken, refreshToken, user: { id: "1", email: "a@b.c" } }),
  );
}

describe("request() — renovacao de sessao concorrente", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("compartilha uma unica renovacao entre requisicoes simultaneas com 401", async () => {
    seedAuth("expirado", "refresh-1");

    let refreshCalls = 0;
    const fetchMock = vi.fn(async (url: string) => {
      const path = String(url);

      if (path.endsWith("/auth/refresh")) {
        refreshCalls += 1;
        // O backend rotaciona o token: uma segunda chamada com "refresh-1"
        // seria rejeitada.
        if (refreshCalls > 1) {
          return new Response(JSON.stringify({ message: "Invalid refresh token" }), { status: 401 });
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        return new Response(
          JSON.stringify({
            accessToken: "novo",
            refreshToken: "refresh-2",
            user: { id: "1", email: "a@b.c" },
          }),
          { status: 200 },
        );
      }

      const auth = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (auth.accessToken !== "novo") {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);
    const api = await import("@/lib/api");

    const results = await Promise.all([
      api.listTenants({}),
      api.listProvisioningProjects({}),
      api.listBillingInvoices({}),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    expect(localStorage.getItem(STORAGE_KEY)).toContain("refresh-2");
  });
});
