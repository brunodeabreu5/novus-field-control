import { AppService } from "./app.service";

describe("AppService", () => {
  it("returns health payload", () => {
    const service = new AppService();
    const status = service.getStatus();

    expect(status).toMatchObject({
      service: "novus-field-control-backend",
      status: "ok",
      purpose: "Central tenant registry and resolver for Novus Field SaaS.",
    });
    expect(status.timestamp).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(status.timestamp))).toBe(false);
  });
});
