import { AppService } from "./app.service";

describe("AppService", () => {
  it("returns health payload", () => {
    const service = new AppService();
    expect(service.getStatus()).toEqual({
      service: "novus-field-control-backend",
      status: "ok",
      purpose: "Central tenant registry and resolver for Novus Field SaaS.",
    });
  });
});
